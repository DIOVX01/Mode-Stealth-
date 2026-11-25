// Starter deck: everyday thinking biases and influence effects. Front = scenario, back = name and definition.
import { newCard } from '../srs.js';

const DECK = [
  ["You think a coworker is lazy, and you notice every late arrival but none of the early ones.", "Confirmation bias: seeking and remembering evidence that fits what you already believe."],
  ["A jacket marked down from 9,000 to 4,000 feels cheap, though 4,000 is more than you planned to spend.", "Anchoring: the first number you see pulls later judgments toward it."],
  ["After news of a plane crash, flying feels more dangerous than driving.", "Availability heuristic: judging how likely something is by how easily examples come to mind."],
  ["You keep watching a boring film because you already paid for the ticket.", "Sunk cost fallacy: continuing because of what you have already spent, not what you will gain."],
  ["After the match, you feel you always knew which team would win.", "Hindsight bias: seeing past events as more predictable than they were."],
  ["A driver cuts you off and you decide they are selfish, not that they might be rushing to a hospital.", "Fundamental attribution error: blaming others’ character while ignoring their situation."],
  ["A well-dressed, confident speaker seems honest and competent before saying anything useful.", "Halo effect: one good trait colours your judgment of everything else about a person."],
  ["You pick the restaurant with the long queue over the empty one next door.", "Bandwagon effect: adopting something because many others already have."],
  ["Losing 500 hurts more than finding 500 feels good.", "Loss aversion: losses weigh roughly twice as much as equal gains."],
  ["A surgery with a 90% survival rate sounds safer than one with a 10% death rate.", "Framing effect: the same facts lead to different choices depending on how they are worded."],
  ["You assume accidents and illness happen to other people, not to you.", "Optimism bias: believing you are less likely than others to face bad outcomes."],
  ["You estimate the report will take two days; it takes five, just like last time.", "Planning fallacy: underestimating how long your own tasks will take, despite past experience."],
  ["Famous dropouts became billionaires, so dropping out looks like a path to success.", "Survivorship bias: judging by the winners you can see and ignoring the failures you cannot."],
  ["Ten compliments and one criticism, and the criticism is what you replay at night.", "Negativity bias: bad events grab more attention and memory than good ones."],
  ["You stay on the same phone plan for years though cheaper ones exist.", "Status quo bias: preferring things to stay as they are, even when change is better."],
  ["You spill coffee on your shirt and feel that everyone in the room noticed.", "Spotlight effect: overestimating how much others notice your appearance and mistakes."],
  ["When you pass, it was your skill; when you fail, the exam was unfair.", "Self-serving bias: crediting yourself for success and blaming outside factors for failure."],
  ["A horoscope says “you have potential you have not fully used”, and it feels written just for you.", "Barnum (Forer) effect: vague statements that fit almost anyone feel personally accurate. Cold readers rely on it."],
  ["A shop gives you a free sample, and you feel you should buy something.", "Reciprocity: feeling obliged to return a favour, even one you did not ask for."],
  ["After agreeing to a small favour, you find it hard to refuse a bigger one.", "Commitment and consistency: once committed, people act to stay consistent with that choice."],
  ["In an unfamiliar situation, you copy what the people around you are doing.", "Social proof: using other people’s behaviour as a guide when unsure."],
  ["You follow advice from someone in a white coat without checking their qualifications.", "Authority bias: giving extra weight to opinions from perceived authority figures."],
  ["“Only 2 left in stock!” makes you want the item more.", "Scarcity effect: things seem more valuable when they are rare or running out."],
  ["A song you disliked at first grows on you after hearing it many times.", "Mere exposure effect: liking things more simply because they are familiar."],
  ["A long holiday with a wonderful last day is remembered as great overall.", "Peak–end rule: memory of an experience is shaped by its most intense moment and its end."],
  ["After buying a laptop, you remember its strengths and forget the flaws you noticed.", "Choice-supportive bias: remembering your past choices as better than they were."],
  ["An expert explains a topic in jargon, unable to imagine not knowing it.", "Curse of knowledge: once you know something, it is hard to imagine not knowing it."],
  ["You trust a stranger more after learning they are from your hometown.", "In-group bias: favouring people who belong to your own group."],
  ["A medium popcorn priced close to the large makes the large look like a bargain.", "Decoy effect: an inferior third option steers you toward a particular choice."],
  ["You feel your nervousness during a speech is obvious to all; the audience barely notices.", "Illusion of transparency: overestimating how well others can read your feelings."],
];

export const starterCards = today => DECK.map(([front, back]) => newCard({ type: 'psych', front, back }, today));
