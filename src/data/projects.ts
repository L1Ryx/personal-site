export const featuredProjects = [
	{
		title: 'Vesuvius',
		meta: 'Wwise runtime audio implementation',
		category: 'Featured',
		description:
			'State-driven ambience, combat feedback, room-aware transitions, and gameplay event pipelines for a surreal action-adventure game.',
		role: 'Lead Engineer, Audio',
		tags: ['Unity', 'C#', 'Wwise', 'Game Audio'],
		image: '/assets/project-vesuvius.png',
		imageAlt: 'Abstract project visual for Vesuvius',
		links: [],
	},
	{
		title: 'Deja You',
		meta: 'Custom gameplay DSP',
		category: 'Featured',
		description:
			'Real-time filtering, delay, bit-depth reduction, gain shaping, and native C++ per-sample DSP for time-loop ghosts.',
		role: 'Technical Lead',
		tags: ['C++', 'DSP', 'Unity', 'Audio Programming'],
		image: '/assets/project-deja-you.png',
		imageAlt: 'Abstract project visual for Deja You',
		links: [],
	},
	{
		title: 'Ducks Afar',
		meta: 'Gameplay architecture and feedback',
		category: 'Featured',
		description:
			'Puzzle-state architecture, UI polish, and audio feedback systems for a grant-funded narrative puzzle game about spatial arithmetic.',
		role: 'Project Lead',
		tags: ['Unity', 'C#', 'Gameplay Systems', 'UI Audio'],
		image: '/assets/project-ducks-afar.png',
		imageAlt: 'Abstract project visual for Ducks Afar',
		links: [],
	},
];

export const additionalProjects = [
	{
		title: 'Love Language',
		meta: 'Horror visual novel / minigames',
		category: 'Collaborative',
		description:
			'Co-produced and led engineering for a short-form horror project, including VFX and audio implementation across interactive sequences.',
		role: 'Co-producer, Lead Engineering',
		tags: ['Unity', 'VFX', 'Audio Implementation', 'Game Jam'],
		image: '/assets/project-love-language.png',
		imageAlt: 'Abstract project visual for Love Language',
		links: [],
	},
	{
		title: 'Epoch Warriors',
		meta: 'WebGL custom audio systems',
		category: 'Collaborative',
		description:
			'Gameplay and audio programming work with custom playback behavior, crossfades, looping, layering, and event-driven audio for WebGL constraints.',
		role: 'Gameplay / Audio Programmer',
		tags: ['Unity', 'WebGL', 'Custom Audio', 'Event Systems'],
		image: '/assets/project-epoch-warriors.png',
		imageAlt: 'Abstract project visual for Epoch Warriors',
		links: [],
	},
	{
		title: 'Hopkins Game Development Society',
		meta: 'Community and technical leadership',
		category: 'Leadership',
		description:
			'Co-founded and led a student game development organization, supporting project teams, workshops, and a stronger campus game-development pipeline.',
		role: 'Co-founder, President',
		tags: ['Leadership', 'Games', 'Community', 'Production'],
		image: '/assets/project-hgds.png',
		imageAlt: 'Abstract project visual for Hopkins Game Development Society',
		links: [],
	},
];

export const allProjects = [...featuredProjects, ...additionalProjects];
