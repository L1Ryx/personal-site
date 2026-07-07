---
title: Spatial Audio in a Custom C++ Engine
subtitle: Obstruction, diffraction, and room-aware reverb
summary: A custom spatial audio system for Negative Space, where sound guides the player through a dark 3D environment.
brow: negative-space-spatial-audio.md
role: Audio Programmer
order: 1
featured: true
types:
  - Audio Programming
  - Systems Programming
tags:
  - C++
  - raylib
  - Dear ImGui
  - DSP
image: /assets/negative-space-audio/negative-space-audio.gif
imageAlt: Gameplay clip of Negative Space showing paint revealing a dark 3D room
demoVideo: https://www.youtube.com/embed/2kKDjIFJj1w
github: https://github.com/L1Ryx/Negative-Space
liveDemo: https://l1ryx.itch.io/negative-space
---

## Overview

Negative Space is a short first-person game set almost entirely in darkness. The player listens for hidden beacons, sprays paint to reveal the room around them, and finds each objective by combining spatial audio cues with the silhouettes left behind in the paint.

For this project, I built a reusable spatial audio stack inside a custom C++ engine. The goal was to make sound a primary gameplay system rather than a layer added after the fact.

This page focuses on the audio system; I wrote separately about the engine architecture in [Custom C++ Game Engine for Negative Space](/projects/custom-cpp-game-engine-negative-space/).

![A dark view of Negative Space before the environment is fully revealed](/assets/negative-space-audio/negative-space-audio-diagnostics.png)

## Spatial Audio Foundation

The base system supports 3D listeners and emitters, distance attenuation, stereo panning, per-emitter range controls, and runtime tuning. Emitters are updated from world-space positions, then mixed through a central audio manager that also handles gain staging, limiting, peak metering, and cue playback.

This made the beacons readable before any advanced propagation was added: players could already turn toward a source, estimate distance, and use volume changes to navigate.

```cpp
float calculateDistanceVolume(const SpatialAudioEmitter& emitter, float distance)
{
    float range = std::max(emitter.maxDistance - emitter.minDistance, 0.001f);
    float t = std::clamp((distance - emitter.minDistance) / range, 0.0f, 1.0f);
    float smoothDistance = t * t * (3.0f - 2.0f * t);
    return emitter.baseVolume * (1.0f - smoothDistance);
}

float calculatePanToPoint(const SpatialAudioListener& listener, float x, float z)
{
    float dx = x - listener.x;
    float dz = z - listener.z;
    float distance = std::sqrt(dx * dx + dz * dz);
    if (distance <= 0.001f)
        return 0.5f;

    float rightAmount = std::cos(listener.yaw) * (dx / distance)
                      + std::sin(listener.yaw) * (dz / distance);
    return std::clamp(0.5f - 0.5f * rightAmount, 0.0f, 1.0f);
}
```

## Obstruction

To make walls matter, I added raycast-based obstruction checks between the listener and each active emitter. When geometry blocks the direct path, the system reduces level and applies low-pass filtering so the sound becomes muffled instead of simply disappearing.

The obstruction values are smoothed over time to avoid abrupt cuts when the player moves quickly around corners or crosses a doorway.

```cpp
int blockedCount = 0;
for (int i = 0; i < sampleCount; i++)
{
    float offset = 0.0f;
    if (i > 0)
    {
        int pairIndex = (i + 1) / 2;
        float sign = (i % 2) == 1 ? 1.0f : -1.0f;
        int pairCount = std::max((sampleCount - 1 + 1) / 2, 1);
        offset = sign * sampleRadius * (static_cast<float>(pairIndex) / pairCount);
    }

    float offsetX = sideX * offset;
    float offsetZ = sideZ * offset;

    if (lineIntersectsAnyOccluder(listener.x + offsetX,
                                  listener.y,
                                  listener.z + offsetZ,
                                  emitter.x + offsetX,
                                  emitter.y,
                                  emitter.z + offsetZ,
                                  occluders))
    {
        blockedCount++;
    }
}

float occlusionAmount = static_cast<float>(blockedCount) / sampleCount;
float cutoffHz = clearCutoffHz + (occludedCutoffHz - clearCutoffHz) * occlusionAmount;
```

## Diffraction and Portals

Direct line-of-sight was not enough for the kind of environment I wanted. Sounds needed to travel through doorways, gaps, and hallway openings, especially when the player and emitter were in different rooms.

I added authored acoustic portals to the room data, then used them to evaluate alternate propagation paths. The system can route sound through nearby openings and blend valid paths, creating a simple diffraction approximation that keeps emitters audible through believable routes.

```cpp
for (size_t i = 0; i < portals.size(); i++)
{
    const AcousticPortal& portal = portals[i];
    if (lineIntersectsAnyOccluder(listener.x, listener.y, listener.z,
                                  portal.x, portal.y, portal.z, occluders))
        continue;
    if (lineIntersectsAnyOccluder(portal.x, portal.y, portal.z,
                                  emitter.x, emitter.y, emitter.z, occluders))
        continue;

    float pathDistance = distance3D(listener.x, listener.y, listener.z,
                                    portal.x, portal.y, portal.z)
                       + distance3D(portal.x, portal.y, portal.z,
                                    emitter.x, emitter.y, emitter.z);
    float volume = calculateDistanceVolume(emitter, pathDistance)
                 * std::clamp(portal.diffractionStrength, 0.0f, 1.0f)
                 * diffractionGain
                 * calculatePortalFacingWeight(listener, emitter, portal);

    insertPortalPath(blend, {static_cast<int>(i), pathDistance, volume,
                             calculatePanToPoint(listener, portal.x, portal.z),
                             portal.x, portal.y, portal.z});
}
```

![A debug view showing acoustic portals and diffraction paths through the level](/assets/negative-space-audio/negative-space-audio-diffraction-and-portals.png)

## Room Awareness

The level is divided into rooms and zones, with metadata authored in JSON. The audio system tracks which room the listener and emitters occupy, then uses that information for propagation, reverb sends, and debugging.

This let small rooms, hallways, and the larger chamber respond differently. The same beacon or paint shot can feel tighter in a small space and more distant or spacious in the larger areas.

```cpp
if (listenerRoom && emitterRoom)
{
    context.sendScale = (listenerRoom->reverbSendScale
                       + emitterRoom->reverbSendScale) * 0.5f;
    context.wetLowPassCutoffHz = combineWetLowPassCutoff(
        listenerRoom->reverbWetLowPassCutoffHz,
        emitterRoom->reverbWetLowPassCutoffHz);
    context.largeRoomBlend = (listenerRoom->reverbLargeRoomBlend
                            + emitterRoom->reverbLargeRoomBlend) * 0.5f;

    if (context.listenerRoomIndex != context.emitterRoomIndex)
        context.sendScale += 0.12f;
}

context.sendScale = std::clamp(context.sendScale, 0.25f, 2.0f);
context.largeRoomBlend = std::clamp(context.largeRoomBlend, 0.0f, 1.0f);
```

## Convolution Reverb

I implemented room-aware convolution reverb using impulse response files. The system supports multiple IRs, including smaller and larger room responses, and blends wet/dry levels based on room context and distance.

The first implementation caused noticeable frame drops and audio artifacts, so I moved the heavier work out of the game update path and switched to a partitioned convolution approach. I also added smoothing and fades around playback changes to reduce pops when beacons are collected or swapped.

```cpp
void PartitionedConvolver::configure(const std::vector<float>& impulseResponse,
                                      size_t requestedBlockSize)
{
    blockSize = nextPowerOfTwo(std::max<size_t>(requestedBlockSize, 16));
    fftSize = blockSize * 2;
    tapCount = impulseResponse.size();
    size_t partitionCount = (impulseResponse.size() + blockSize - 1) / blockSize;

    frequencyPartitions.assign(partitionCount, std::vector<Complex>(fftSize, Complex{}));
    inputHistory.assign(partitionCount, std::vector<Complex>(fftSize, Complex{}));

    for (size_t partition = 0; partition < partitionCount; partition++)
    {
        auto& frequencyPartition = frequencyPartitions[partition];
        size_t offset = partition * blockSize;
        size_t taps = std::min(blockSize, impulseResponse.size() - offset);
        for (size_t tap = 0; tap < taps; tap++)
            frequencyPartition[tap] = Complex(impulseResponse[offset + tap], 0.0f);
        fft(frequencyPartition, false);
    }
}
```

```cpp
Dsp::InterleavedPartitionedConvolver& activeConvolver =
    activeImpulseResponseSlot == ImpulseResponseSlot::LargeRoom
        ? largeReverbConvolver
        : smallReverbConvolver;

if (activeConvolver.isLoaded() && reverbSend > 0.0001f)
{
    activeConvolver.processFrame(wetFrame);
    reverbWetLowPass.setCutoffHz(reverbWetCutoffSmoother.process());
    reverbWetLowPass.processFrame(wetFrame);

    output[outputIndex] = dryFrame[0] + wetFrame[0] * volume * reverbSend;
    output[outputIndex + 1] = dryFrame[1] + wetFrame[1] * volume * reverbSend;
}
```

![Impulse response files used for room-aware convolution reverb](/assets/negative-space-audio/negative-space-audio-IR-files.png)

## Audio Cues and Variation

The engine audio layer also supports authored cues, round-robin sample selection, pitch and volume randomization, reverb sends, and delay sends. I used this for footsteps, paint shots, beacon radar pings, pickup sounds, and looping room tone.

These systems kept repeated sounds from feeling static while still giving each sound category its own mix behavior.

```json
{
      "name": "footstep",
      "type": "processed_stream",
      "assets": [
        "assets/audio/step-a.wav",
        "assets/audio/step-b.wav",
        "assets/audio/step-c.wav",
        "assets/audio/step-d.wav"
      ],
      "spatialized": true,
      "volume": 0.72,
      "pitch": 1.0,
      "randomization": {
        "volumeMin": 0.88,
        "volumeMax": 1.08,
        "pitchMin": 0.94,
        "pitchMax": 1.06
      },
      "cooldownSeconds": 0.05,
      "minDistance": 0.35,
      "maxDistance": 9.0,
      "reverbSendMultiplier": 1.1,
      "largeRoomReverbSendBoost": 0.08,
      "largeRoomEchoSend": 0.035,
      "largeRoomEchoDelaySeconds": 0.12,
      "largeRoomEchoFeedback": 0.18,
      "bufferFrameCount": 2048,
      "sourceAttackSeconds": 0.004,
      "sourceReleaseSeconds": 0.025,
      "eventAttackSeconds": 0.006,
      "smallImpulseResponse": "assets/audio/IR-small-room.wav",
      "largeImpulseResponse": "assets/audio/IR-large-room.wav",
      "largeIrMaxLengthSeconds": 1.25,
      "largeIrMaxTapCount": 55125,
      "largeIrNormalizePeak": 0.022,
      "largeIrHeadFadeSeconds": 0.025,
      "largeIrTailFadeSeconds": 0.08,
      "largeIrPartitionBlockSize": 2048
    },
```


## Debugging and Tuning

I built ImGui debug panels for inspecting listener state, emitter state, obstruction, propagation, reverb, peak levels, and live tunables. Acoustic portals and trace paths can also be visualized in-world.

![A brighter debug view showing Negative Space audio diagnostics and acoustic visualization](/assets/negative-space-audio/negative-space-audio-diagnostics-lit-up.png)

Most gameplay and audio values are exposed through JSON so I can rebalance the experience without recompiling.
