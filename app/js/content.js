// Story and stop content for Operation Root Hog.
// Answers are not stored here. Edit tools/answers.json and run tools/build_answers.py.
// Lines marked SCOUT need checking in person before game day.

window.GAME = {
  title: "Operation Root Hog",
  hq: "Arco Rec Center",

  // Families sign up ahead of time; their phones count down to this date and wait for the game master to start.
  gameDay: {
    date: "2026-11-26",
    where: "See you Thanksgiving morning, Thursday, November 26, at the Arco Rec Center.",
  },

  // "What happened in 2024?" on the front page. Edit freely; it's only story.
  backstory: {
    title: "The case file",
    sections: [
      {
        heading: "Who are the Bad Guys?",
        text:
          "Nobody has seen their faces. They work from the shadows, they talk big over the radio, " +
          "and they can't stand a holiday that brings families together.",
      },
      {
        heading: "Operation Feather Recovery, 2024",
        text:
          "Right before Thanksgiving 2024, the Bad Guys snatched Ambassador Gobbles. Families became agents for the day, " +
          "tracked down the clues the Bad Guys left behind, cracked every code, and freed Gobbles in time for dinner.",
      },
      {
        heading: "Why they're back",
        text:
          "The Bad Guys never got over losing. This year Ambassador Gobbles is chairing the Thanksgiving Peace Summit " +
          "in Arco, and the Bad Guys have a plan for the town's lights. Station ARCO needs every family it can get.",
      },
    ],
  },

  // The briefing plays as scenes: a picture (see js/scenes.js) with narration under it.
  // With sound on, each scene is read aloud and the next one starts when it finishes.
  // image: "img/file.jpg" swaps the drawing for a photo. audio: the recording for that line (see VOICE-SCRIPT.md);
  // until the file exists in app/audio/, the phone reads the text aloud instead.
  briefing: [
    {
      scene: "radio",
      voice: "operator",
      from: "Station ARCO",
      audio: "audio/briefing-01-radio.mp3",
      text: "Incoming transmission. All agents, stand by.",
    },
    {
      scene: "summit",
      voice: "operator",
      from: "Operator Arco",
      audio: "audio/briefing-02-summit.mp3",
      cut: true, // the Bad Guys break in mid-sentence: no pause before the next scene
      text:
        "Station ARCO to all agents. This is Operator Arco. Do you copy?\n\n" +
        "Big day in Arco. Ambassador Gobbles is here to chair the Thanksgiving Peace Summit, " +
        "and every family in the valley is invited. The summit opens at noon, and the pies are already in the",
    },
    {
      scene: "badguys",
      voice: "badguys",
      from: "The Bad Guys",
      audio: "audio/briefing-03-badguys.mp3",
      text:
        "Breaking in on this frequency. This is the Bad Guys, calling every so-called agent in the Lost River Valley.\n\n" +
        "Remember us? You took our turkey in 2024. This year we're taking the whole town.",
    },
    {
      scene: "blackout",
      voice: "badguys",
      from: "The Bad Guys",
      audio: "audio/briefing-04-blackout.mp3",
      text:
        "Before it was Arco, this place was called Root Hog. Fitting, because today we root out every last light. " +
        "At noon, with every turkey in town in the oven, we cut the power. No ovens, no pie, no Peace Summit.\n\n" +
        "We've jammed every relay in the valley. Good luck finding them.\n\nBad Guys out.",
    },
    {
      scene: "station",
      voice: "operator",
      from: "Operator Arco",
      audio: "audio/briefing-05-back-on-air.mp3",
      text: "Station ARCO, back on the air. Agents, do you copy?\n\nThat was the Bad Guys. Here's what you need to know.",
    },
    {
      scene: "gobbles",
      voice: "operator",
      from: "Operator Arco",
      audio: "audio/briefing-06-gobbles.mp3",
      text:
        "Some of you met them in 2024. In Operation Feather Recovery they snatched Ambassador Gobbles, " +
        "and agents cracked every one of their codes to bring him home. The Bad Guys never got over it. " +
        "Now they want to ruin his summit.",
    },
    {
      scene: "count",
      voice: "operator",
      from: "Operator Arco",
      audio: "audio/briefing-07-count.mp3",
      text:
        "Here's what they don't know. This town is named for Count Georg von Arco, a German radio pioneer who never set foot in Idaho. " +
        "Legend says he sent a gift to the town that carried his name: eight radio relays hidden around the valley.",
    },
    {
      scene: "atom1955",
      voice: "operator",
      from: "Operator Arco",
      audio: "audio/briefing-08-1955.mp3",
      text: "In 1955, when Arco became the first town lit by atomic power, those relays carried the signal.",
    },
    {
      scene: "mission",
      voice: "operator",
      from: "Operator Arco",
      audio: "audio/briefing-09-mission.mp3",
      text:
        "Today the Bad Guys have jammed every relay and power station in the valley. It's up to you to bring them back.\n\n" +
        "Every two relays you restore unlock one digit of your family's code. " +
        "Once every family has its code, we throw the master switch together and the power comes back on.\n\n" +
        "Report in at every relay. Station ARCO, over and out.",
    },
  ],

  // Shown on the TV after the last briefing scene, while everyone waits for the game to start.
  missionPoints: [
    "Find and restore 8 radio relays around Arco and Moore. One of them is written just for your family.",
    "Every 2 relays you restore unlock 1 digit of your family's padlock code.",
    "Report in on your phone at every relay. Junior agents have puzzles of their own.",
    "Navigators work the phone. Drivers keep their eyes on the road.",
    "The Bad Guys chained the master switch shut with one padlock for every family. When every family has its code, we unlock it and throw the switch together.",
  ],

  // The Bad Guys break in on a family's phone when it restores its 2nd, 4th and 6th relay.
  // audio: the recording (see VOICE-SCRIPT.md); until the file exists the phone reads the line aloud.
  taunts: {
    2: {
      audio: "audio/taunt-1.mp3",
      text: "Breaking in on this frequency. One digit, agents? Cute. That lock has four, and the next relay is hidden better than the last. Bad Guys out.",
    },
    4: {
      audio: "audio/taunt-2.mp3",
      text: "Bad Guys to the so-called agents. Two digits. Fine. You're halfway, and we are getting annoyed. Nobody finds the rest. Nobody. Bad Guys out.",
    },
    6: {
      audio: "audio/taunt-3.mp3",
      text: "This is the Bad Guys. Three digits? Who is helping you? No matter. The last relays are the hard ones, and noon is coming fast. Bad Guys out.",
    },
  },

  // The mid-game twist, sent to every phone from the console's "Send the Gobbles twist" button.
  twist: {
    from: "The Bad Guys",
    voice: "badguys",
    audio: "audio/twist-gobbles.mp3",
    text:
      "Breaking in on this frequency. Your ambassador would not stop talking about gratitude, so we took him. " +
      "Ambassador Gobbles is locked inside the substation with the master switch. Bring every code you've got. Bad Guys out.",
  },

  relays: [
    {
      id: "sub",
      name: "Sub Relay",
      audio: "audio/relay-sub.mp3",
      cluster: "arco",
      place: "Idaho Science Center, 335 S. Front St., Arco",
      mapQuery: "335 S Front St, Arco, ID 83213",
      find:
        "We jammed a relay inside a ship that will never sail again. It stands on the south end of town, a long way from any ocean.",
      transmission:
        "Station ARCO to all agents.\n\nYou're standing beside the sail of USS Hawkbill, a nuclear submarine. " +
        "The Navy sent it here because the engine for the first nuclear submarine was tested in the desert near Arco. " +
        "The Bad Guys scrambled this relay's frequency. The marker will tell you how to fix it. Over.",
      history:
        "USS Hawkbill served from 1971 to 2000. Its sail, the tall tower on top of the sub, was set up here on July 19, 2003, " +
        "as a memorial to all Navy submarine veterans. The USS S-27 marker beside it tells about a submarine that ran aground " +
        "in fog in the Aleutian Islands in 1942. Every sailor aboard was rescued.",
      source: { label: "HMDB", url: "https://www.hmdb.org/m.asp?m=103649" },
      clue: "The Bad Guys changed the frequency to the submarine's length. Find the length in feet on the Hawkbill marker.",
      answerKind: "number",
      hints: [
        "Look for the marker with the submarine's facts: keel, launch, length, beam.",
        "The number you want comes right before the word feet.",
      ],
      junior: {
        type: "choice",
        prompt: "Find the torpedo. Which one is it?",
        options: [
          { value: "torpedo", label: "Long and round, with fins at the back", icon: "torpedo" },
          { value: "anchor", label: "Shaped like a hook", icon: "anchor" },
          { value: "tower", label: "A tall tower", icon: "tower" },
        ],
      },
    },
    {
      id: "peace",
      name: "Peace Relay",
      audio: "audio/relay-peace.mp3",
      cluster: "arco",
      place: "Atoms for Peace marker, W. Grand Ave. south of S. Bingham St., Arco",
      mapQuery: "Atoms for Peace historical marker, Arco, ID",
      find:
        "Our next jammer sits beside a roadside sign about the day the whole town ran on the atom. Look along Grand Avenue for a marker about peace.",
      transmission:
        "Station ARCO to all agents.\n\nOn July 17, 1955, a reactor out in the desert lit Arco for about an hour. " +
        "It was the first time a whole town ran on electricity from the atom. " +
        "The Bad Guys set this relay's dial to the wrong date. Set it back. Over.",
      history:
        "The Atomic Energy Commission picked Arco for a test of peaceful uses of atomic power. On July 17, 1955, " +
        "electricity from the BORAX-III reactor at the National Reactor Testing Station, southeast of town, lit Arco for about an hour. " +
        "That testing station is now Idaho National Laboratory.",
      source: { label: "HMDB", url: "https://www.hmdb.org/m.asp?m=68916" },
      clue: "Tune the dial to the date on the marker, written as numbers: the month, the day, then the last two digits of the year.",
      answerKind: "number",
      hints: ["The date is in July.", "July is the 7th month. Then the day, then 55."],
      junior: { type: "count", prompt: "Count the words in the big title at the top of the marker." },
    },
    {
      id: "courthouse",
      name: "Courthouse Relay",
      audio: "audio/relay-courthouse.mp3",
      cluster: "arco",
      place: "Butte County Courthouse, 256 W. Grand Ave., Arco",
      mapQuery: "256 W Grand Ave, Arco, ID 83213",
      find:
        "The judge is off for the holiday, but the county's old office is still open to spies. Find the red brick building where Butte County was run.",
      // The Bad Guys scramble this riddle; families read it with the decoder wheel from the field kit.
      // key: the outer-ring letter the inner wheel's A lines up with. message: what it decodes to.
      wheel: { key: "R", message: "RED BRICK COURTHOUSE" },
      transmission:
        "Station ARCO to all agents.\n\nArco is the county seat, the town where Butte County is run from. " +
        "The county bought this brick building in 1934 for $1,166. " +
        "The Bad Guys hid the relay code in its address. Over.",
      history:
        "Butte County was created on February 6, 1917, with Arco as its county seat. Arco had already moved once: in 1901 the town " +
        "moved to this spot to be on the new railroad from Blackfoot to Mackay. That rail line closed in 1961. " +
        "This courthouse was built in 1919 and 1920, and the county bought it on May 1, 1934, for $1,166.",
      source: { label: "Courthouses.co", url: "https://courthouses.co/?p=10236" },
      clue: "Add the street number on the courthouse to the year the county bought it.",
      answerKind: "number",
      hints: ["The year is on your history card.", "Find the street number on the building, then add 1934."],
      // SCOUT: count the front windows, set junior in answers.json, then change this to type "count".
      junior: { type: "open", prompt: "Count the windows on the front of the building. Say the number out loud, then tap Done." },
    },
    {
      id: "hill",
      name: "Hill Relay",
      audio: "audio/relay-hill.mp3",
      cluster: "arco",
      place: "Anywhere downtown with a clear view of Number Hill",
      mapQuery: "Number Hill, Arco, ID",
      find:
        "Some say the numbers on the hill above town are how high the river flooded. We say so too. Find a spot where you can see them all.",
      transmission:
        "Station ARCO to all agents.\n\nThe Bad Guys are spreading a rumor that the numbers on that hill mark old floods of the Big Lost River. " +
        "Prove them wrong. Nobody climbs today. Use binoculars, or zoom in with a phone camera. Over.",
      history:
        "Since 1920, each graduating class of Butte County High School has painted its year on the rocks above town. " +
        "That's why it's called Number Hill. Some locals like to tell visitors the numbers are high-water marks of the river. They aren't.",
      source: { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Arco,_Idaho" },
      clue: "Arco was first lit by the atom in 1955. Find the class that graduated 11 years later, and type the two digits painted on the hill.",
      answerKind: "number",
      hints: ["Each number on the hill is the last two digits of a graduation year.", "1955 plus 11 is 1966. Look for 66."],
      junior: { type: "open", prompt: "With binoculars, find the year you were born on the hill. Tap Done when you see it." },
    },
    {
      id: "press",
      name: "Press Relay",
      audio: "audio/relay-press.mp3",
      cluster: "arco",
      place: "Bottolfsen Park, Arco",
      mapQuery: "Bottolfsen Park, Arco, ID",
      find:
        "A newspaperman from this town grew up to run the whole state. Twice. The park with his name hides our next jammer.",
      transmission:
        "Station ARCO to all agents.\n\nIn 1910 a 19-year-old named Clarence Bottolfsen came to Arco to run the town newspaper, the Arco Advertiser. " +
        "He ended up governor of Idaho. The Bad Guys hid a word inside an old front page. Open the newspaper in your field kit. Over.",
      history:
        "C. A. Bottolfsen came to Arco in 1910, at 19, to manage the Arco Advertiser. He later bought the paper and published it until 1949. " +
        "He was Idaho's 17th governor from 1939 to 1941 and its 19th from 1943 to 1945. This park is named for him.",
      source: { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/C._A._Bottolfsen" },
      clue: "Read the first letter of each headline on the front page, from top to bottom.",
      answerKind: "word",
      hints: ["There are five headlines.", "It's something Arco was the first town to get from the atom."],
      junior: { type: "honor", prompt: "Find the turkey hiding in the newspaper ads. Tap when you find it." },
    },
    {
      id: "river",
      name: "River Relay",
      audio: "audio/relay-river.mp3",
      cluster: "arco",
      place: "A bridge over the Big Lost River in Arco (stay on the sidewalk)",
      mapQuery: "Big Lost River, Arco, ID",
      find:
        "Our last signal came from above water, or water that used to be there. Find where a road crosses the Big Lost River in town. Stay on the sidewalk.",
      transmission:
        "Station ARCO to all agents.\n\nWe recorded a message the Bad Guys sent the old way, the way Count von Arco's radio stations did it: dots and dashes. " +
        "Play it as many times as you need and decode it with your Morse card. Over.",
      history:
        "The Big Lost River starts high in the mountains and runs down through this valley. It never reaches another river. " +
        "Past Arco it drains into the ground at the Big Lost River Sinks, and the water keeps traveling underground.",
      source: { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Big_Lost_River" },
      clue: "Play the signal and decode it with your Morse card.",
      morse: "SINKS",
      answerKind: "word",
      hints: ["Five letters. The first one is three dots.", "It's where the river goes into the ground."],
      junior: {
        type: "open",
        prompt: "Look at the river. Is there water in it today?",
        options: [
          { value: "full", label: "Lots of water" },
          { value: "low", label: "A little water" },
          { value: "dry", label: "Dry" },
        ],
      },
    },
    {
      id: "island",
      name: "Island Relay",
      audio: "audio/relay-island.mp3",
      cluster: "moore",
      place: "Pearson Park, Moore (3150 N. near Main St.)",
      mapQuery: "Pearson Park, Moore, ID",
      find:
        "Before this town had its name, people called it Island. Find the park named for the man who ran the stage line to Challis.",
      transmission:
        "Station ARCO to all agents.\n\nYou're in Moore, which was settled as Island before 1890. Two markers stand in this park. " +
        "One is about a pioneer family. The other is about the valley's first church. The Bad Guys need you to do some building math. Over.",
      history:
        "Benjamin A. Pearson homesteaded in this valley in 1884 and ranched here for 45 years. In 1896 he ran freight and a stage line " +
        "from Blackfoot to Challis, and in 1918 he became Butte County's first state senator. The marker beside his tells about the " +
        "valley's first church: built in 1898, moved to Moore in 1910, and torn down in 1950.",
      source: { label: "HMDB", url: "https://www.hmdb.org/m.asp?m=140067" },
      clue: "The church marker gives the size of the 1898 chapel in feet. Multiply the two numbers.",
      answerKind: "number",
      hints: ["Look for two numbers with the word by between them.", "38 times 54."],
      junior: { type: "count", prompt: "Count the Pearson children named on the marker." },
    },
  ],

  family: {
    id: "family",
    name: "Family Relay",
    audio: "audio/relay-family.mp3",
    unlockAfter: 3,
    transmission:
      "Station ARCO to your family only.\n\nThis relay is coded for you. No one else in the valley can solve it. Work it out in the car. Over.",
    waiting: "Your family's clue isn't ready yet. Operator Arco will send it before the game starts.",
    junior: { type: "honor", prompt: "Junior agents: tell everyone in the car your favorite Thanksgiving food, then tap Done." },
  },

  finale: {
    goTo: "All your relays are back on. Head to the substation: the Arco Rec Center.",
    goToTwist: "All your relays are back on. Ambassador Gobbles is locked in the substation with the master switch. Head to the Arco Rec Center.",
    lockNote: "The Bad Guys chained the master switch shut with one padlock for every family. This is your family's code. Open your lock on the lockout box, then wait for the other families.",
    quiz: [
      { text: "Arco was once called Root Hog.", truth: true, why: "That was the town's name before it became Arco." },
      { text: "Count von Arco came to Arco to see the lights turn on in 1955.", truth: false, why: "He died in 1940 and never visited Idaho." },
      { text: "Four light bulbs were the first things lit by electricity from EBR-I, in 1951.", truth: true, why: "It happened on December 20, 1951, 18 miles east of Arco." },
      { text: "The numbers on Number Hill mark old river floods.", truth: false, why: "They're graduation years, painted since 1920." },
      { text: "Count von Arco hid eight radio relays in the valley.", truth: false, why: "That's the story we made up for today." },
      { text: "A submarine sail stands in Arco to honor Navy submarine veterans.", truth: true, why: "It was set up in 2003." },
    ],
    switchText: "Junior agents, on Operator Arco's count, throw the switch.",
    victory: {
      from: "Ambassador Gobbles",
      audio: "audio/finale-victory.mp3",
      text:
        "Agents, thank you. The Bad Guys were sure no single family could throw that switch, and they were right. It took all of you. " +
        "The Peace Summit is back on, and the pie is ready. Happy Thanksgiving. Over and out.",
    },
  },

  scoring: { relay: 100, juniorFirstTry: 25, hint: -25, map: -25 },
};
