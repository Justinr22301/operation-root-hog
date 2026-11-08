// Story and stop content for Operation Root Hog.
// Answers are not stored here. Edit tools/answers.json and run tools/build_answers.py.
// Lines marked SCOUT need checking in person before game day.

window.GAME = {
  title: "Operation Root Hog",
  hq: "Arco Rec Center",

  kickoff: {
    where: "Meet at the Arco Rec Center and look up at the sign over the door.",
    clue: "The Bad Guys' broadcast says Arco sits at 5,309 feet. The sign above you says something different. Enter the elevation on the sign.",
    hint: "It's on the bottom line of the white panel.",
  },

  briefing: [
    {
      voice: "badguys",
      from: "The Bad Guys",
      audio: null, // e.g. "audio/hijack.mp3"
      text:
        "Breaking in on this frequency. This is the Bad Guys, calling every so-called agent in the Lost River Valley.\n\n" +
        "Remember us? You took our turkey in 2024. This year we're taking the whole town.\n\n" +
        "Before it was Arco, this place was called Root Hog. Fitting, because today we root out every last light. " +
        "At noon, with every turkey in town in the oven, we cut the power. No ovens, no pie, no Peace Summit.\n\n" +
        "We've jammed every relay in the valley. Good luck finding them.\n\nBad Guys out.",
    },
    {
      voice: "operator",
      from: "Operator Arco",
      audio: null, // e.g. "audio/briefing.mp3"
      text:
        "Station ARCO to all agents. This is Operator Arco. Do you copy?\n\n" +
        "That was the Bad Guys. Some of you met them in 2024. In Operation Feather Recovery they snatched Ambassador Gobbles, " +
        "and agents cracked every one of their codes to bring him home. The Bad Guys never got over it.\n\n" +
        "This year Ambassador Gobbles is chairing the Thanksgiving Peace Summit right here in Arco. " +
        "The Bad Guys want to ruin it, and they want you to know they're back.\n\n" +
        "This town is named for Count Georg von Arco, a German radio pioneer who never set foot in Idaho. " +
        "Legend says he sent a gift to the town that carried his name: eight radio relays hidden around the valley. " +
        "In 1955, when Arco became the first town lit by atomic power, those relays carried the signal.\n\n" +
        "Today the Bad Guys have jammed every one. Restore your relays. Every two you bring back give you one digit of your family's code. " +
        "When every family has its code, we throw the master switch together.\n\n" +
        "Report in at every relay. Station ARCO, over and out.",
    },
  ],

  relays: [
    {
      id: "sub",
      name: "Sub Relay",
      cluster: "arco",
      place: "Idaho Science Center, 335 S. Front St., Arco",
      mapQuery: "335 S Front St, Arco, ID 83213",
      find:
        "We hid a relay inside a ship that will never sail again. It stands on the south end of town, a long way from any ocean.",
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
      cluster: "arco",
      place: "Butte County Courthouse, 256 W. Grand Ave., Arco",
      mapQuery: "256 W Grand Ave, Arco, ID 83213",
      find:
        "The judge is off for the holiday, but the county's old office is still open to spies. Find the red brick building where Butte County was run.",
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
      // SCOUT: replace with the year you pick while scouting, and update answers.json.
      clue: "Find the oldest year you can read on the hill.",
      answerKind: "number",
      hints: ["The class years started in 1920.", "Look for the faded numbers, not the fresh ones."],
      junior: { type: "open", prompt: "With binoculars, find the year you were born on the hill. Tap Done when you see it." },
    },
    {
      id: "press",
      name: "Press Relay",
      cluster: "arco",
      place: "Bottolfsen Park, Arco",
      mapQuery: "Bottolfsen Park, Arco, ID",
      find:
        "A newspaperman from this town grew up to run the whole state. Twice. The park with his name has our next relay.",
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
    unlockAfter: 3,
    transmission:
      "Station ARCO to your family only.\n\nThis relay is coded for you. No one else in the valley can solve it. Work it out in the car. Over.",
    waiting: "Your family's clue isn't ready yet. Operator Arco will send it before kickoff.",
    junior: { type: "honor", prompt: "Junior agents: tell everyone in the car your favorite Thanksgiving food, then tap Done." },
  },

  finale: {
    goTo: "All your relays are back on. Head to the substation: the Arco Rec Center.",
    lockNote: "This is your family's padlock code. Open your lock on the lockout box, then wait for the other families.",
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
      audio: null, // e.g. "audio/victory.mp3"
      text:
        "Agents, thank you. The Bad Guys were sure no single family could throw that switch, and they were right. It took all of you. " +
        "The Peace Summit is back on, and the pie is ready. Happy Thanksgiving. Over and out.",
    },
  },

  scoring: { relay: 100, juniorFirstTry: 25, hint: -25, map: -25 },
};
