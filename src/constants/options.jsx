export const budgetOptions = [
  {
    id: 1,
    title: "Cheap",
    desc: "Stay conscious of costs",
    icon: "💵"
  },
  {
    id: 2,
    title: "Moderate",
    desc: "Keep cost on the average side",
    icon: "💰"
  },
  {
    id: 3,
    title: "Luxury",
    desc: "Don't worry about cost",
    icon: "💸"
  }
];

export const companionsOptions = [
  {
    id: 1,
    title: "Solo",
    desc: "A sole traveler in exploration",
    icon: "✈️",
    people: '1'
  },
  {
    id: 2,
    title: "Couple",
    desc: "Two travelers in tandem",
    icon: "🥂",
    people: '2 people'
  },
  {
    id: 3,
    title: "Family",
    desc: "A group of fun-loving adventurers",
    icon: "🏡",
    people: '3 to 5 people'
  },
  {
    id: 4,
    title: "Friends",
    desc: "A bunch of thrill-seekers",
    icon: "⛵",
    people: '5 to 10 people'
  }
];

// Prompts now live in api/_prompts.js — they are built server-side so the
// generation endpoint can't be repurposed as a general-purpose LLM proxy.