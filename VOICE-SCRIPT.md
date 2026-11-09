# Voice-over script

Save every recording in **`app/audio/`** with the exact file name shown (lowercase, `.mp3`).
The game already points at these names. Any file that isn't there yet is read aloud by the phone's voice,
so you can record them a few at a time.

Tips: record each line as its own file, leave about half a second of quiet at each end, and keep the
radio feel (Operator steady, Bad Guys low and smug, Gobbles warm and grand). After adding files, commit and push.

`briefing-02-summit.mp3` is cut off on purpose. Stop right on "in the" with no breath after it; the Bad Guys
break in the instant the file ends.

`briefing-glitch.mp3` is the sound effect for the takeover. It plays for the 3.4-second "SIGNAL HIJACKED"
screen, then fades out under the Bad Guys' first words.

---

## Operator Arco (13 files)

**briefing-01-radio.mp3**
> Incoming transmission. All agents, stand by.

**briefing-02-summit.mp3** *(gets cut off)*
> Station ARCO to all agents. This is Operator Arco. Do you copy?
>
> Big day in Arco. Ambassador Gobbles is here to chair the Thanksgiving Peace Summit, and every family in the valley is invited. The summit opens at noon, and the pies are already in the

**briefing-05-back-on-air.mp3**
> Station ARCO, back on the air. Agents, do you copy?
>
> That was the Bad Guys. Here's what you need to know.

**briefing-06-gobbles.mp3**
> Some of you met them in 2024. In Operation Feather Recovery they snatched Ambassador Gobbles, and agents cracked every one of their codes to bring him home. The Bad Guys never got over it. Now they want to ruin his summit.

**briefing-07-count.mp3**
> Here's what they don't know. This town is named for Count Georg von Arco, a German radio pioneer who never set foot in Idaho. Legend says he sent a gift to the town that carried his name: eight radio relays hidden around the valley.

**briefing-08-1955.mp3**
> In 1955, when Arco became the first town lit by atomic power, those relays carried the signal.

**briefing-09-mission.mp3**
> Today the Bad Guys have jammed every relay and power station in the valley. It's up to you to bring them back.
>
> Every two relays you restore unlock one digit of your family's code. Once every family has its code, we throw the master switch together and the power comes back on.
>
> Report in at every relay. Station ARCO, over and out.

**relay-sub.mp3** (Sub Relay)
> Station ARCO to all agents.
>
> You're standing beside the sail of USS Hawkbill, a nuclear submarine. The Navy sent it here because the engine for the first nuclear submarine was tested in the desert near Arco. The Bad Guys scrambled this relay's frequency. The marker will tell you how to fix it. Over.

**relay-peace.mp3** (Peace Relay)
> Station ARCO to all agents.
>
> On July 17, 1955, a reactor out in the desert lit Arco for about an hour. It was the first time a whole town ran on electricity from the atom. The Bad Guys set this relay's dial to the wrong date. Set it back. Over.

**relay-courthouse.mp3** (Courthouse Relay)
> Station ARCO to all agents.
>
> Arco is the county seat, the town where Butte County is run from. The county bought this brick building in 1934 for $1,166. The Bad Guys hid the relay code in its address. Over.

**relay-hill.mp3** (Hill Relay)
> Station ARCO to all agents.
>
> The Bad Guys are spreading a rumor that the numbers on that hill mark old floods of the Big Lost River. Prove them wrong. Nobody climbs today. Use binoculars, or zoom in with a phone camera. Over.

**relay-press.mp3** (Press Relay)
> Station ARCO to all agents.
>
> In 1910 a 19-year-old named Clarence Bottolfsen came to Arco to run the town newspaper, the Arco Advertiser. He ended up governor of Idaho. The Bad Guys hid a word inside an old front page. Open the newspaper in your field kit. Over.

**relay-river.mp3** (River Relay)
> Station ARCO to all agents.
>
> We recorded a message the Bad Guys sent the old way, the way Count von Arco's radio stations did it: dots and dashes. Play it as many times as you need and decode it with your Morse card. Over.

**relay-island.mp3** (Island Relay, Moore)
> Station ARCO to all agents.
>
> You're in Moore, which was settled as Island before 1890. Two markers stand in this park. One is about a pioneer family. The other is about the valley's first church. The Bad Guys need you to do some building math. Over.

**relay-family.mp3** (Family Relay)
> Station ARCO to your family only.
>
> This relay is coded for you. No one else in the valley can solve it. Work it out in the car. Over.

---

## The Bad Guys (2 files)

**briefing-03-badguys.mp3**
> Breaking in on this frequency. This is the Bad Guys, calling every so-called agent in the Lost River Valley.
>
> Remember us? You took our turkey in 2024. This year we're taking the whole town.

**briefing-04-blackout.mp3**
> Before it was Arco, this place was called Root Hog. Fitting, because today we root out every last light. At noon, with every turkey in town in the oven, we cut the power. No ovens, no pie, no Peace Summit.
>
> We've jammed every relay in the valley. Good luck finding them.
>
> Bad Guys out.

---

## Ambassador Gobbles (1 file)

**finale-victory.mp3** (plays after the master switch)
> Agents, thank you. The Bad Guys were sure no single family could throw that switch, and they were right. It took all of you. The Peace Summit is back on, and the pie is ready. Happy Thanksgiving. Over and out.

---

If you change any wording in `app/js/content.js`, re-record that file so the voice matches the words on screen.
Live messages you send from the game master console are always read by the phone's voice.
