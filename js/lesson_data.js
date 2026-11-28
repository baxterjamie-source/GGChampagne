/* Lesson content: one object per week. Engine: lessons.js. Rules: reveal_app/FRENCH_LESSONS.md.
   SECRECY: everything in this file ships to her phone. Only add a lesson here if it can't spoil a locked
   reveal, or once lessons sit behind the reveal gate (not built yet).

   Objects: g: 'f' | 'm' gives the gender when the article doesn't show it (l'église).
   Choice options: a string, or { t: 'the option', why: 'why it is / isn't right, and when you would say it' }.
   Every option should have a why: she can tap them all, even after finding the right one. */
'use strict';

const LESSONS = [
  {
    week: 0, unlock: '2026-12-25T08:00:00', scene: 'terrasse', music: 'accordion',
    titleFr: 'Bonsoir !', titleEn: 'Greetings and thank-yous',
    dialogueView: { x: 320, y: 170, w: 680, h: 425 },

    // Step 1: the scene. Tappable things, each linked to a phrase.
    objects: [
      { id: 'soleil', fr: 'le soleil', en: 'the sun', hint: 'luh soh-LAY', link: { fr: 'Bonjour !', en: 'Hello! (in the daytime)' } },
      { id: 'lune', fr: 'la lune', en: 'the moon', hint: 'lah LÜN', tip: 'The French "u" has no English twin. Push your lips forward into a tight "oo" and hold them there, but keep your tongue high and forward, where it sits for "ee". Neither "loon" nor "lean": something in between.', link: { fr: 'Bonsoir !', en: 'Good evening!' } },
      { id: 'serveur', fr: 'le serveur', en: 'the waiter', hint: 'luh sair-VUR', link: { fr: "Monsieur, s'il vous plaît !", en: 'Excuse me! (to call the waiter, never "garçon")' } },
      { id: 'table', fr: 'la table', en: 'the table', hint: 'lah TAH-bl', link: { fr: "Une table pour deux, s'il vous plaît.", en: 'A table for two, please.' } },
      { id: 'chaise', fr: 'la chaise', en: 'the chair', hint: 'lah SHEZ' },
      { id: 'bouteille', fr: 'la bouteille', en: 'the bottle', hint: 'lah boo-TAY', link: { fr: 'Une bouteille de champagne', en: 'A bottle of champagne' } },
      { id: 'verre', fr: 'la flûte', en: 'the champagne flute', hint: 'lah FLÜT', link: { fr: 'Santé !', en: 'Cheers! (literally "health")' } },
      { id: 'eglise', fr: "l'église", g: 'f', en: 'the church', hint: 'lay-GLEEZ', tip: 'Every village in Champagne has one. The bells ring the hours, even across the vines.', link: { fr: "C'est magnifique !", en: "It's beautiful!" } },
      { id: 'terrasse', fr: 'la terrasse', en: 'the terrace', hint: 'lah teh-RASS', tip: 'Sitting outside at a café or restaurant is "en terrasse".', link: { fr: 'On peut s\'asseoir en terrasse ?', en: 'Can we sit outside?' } },
      { id: 'store', fr: 'le store', en: 'the awning', hint: 'luh STOR', tip: 'A café awning is "le store" (or "l\'auvent"). Inside a house, "le store" is a window blind.' },
      { id: 'guirlande', fr: 'la guirlande', en: 'the string of lights', hint: 'lah geer-LAHND', tip: 'In full: "une guirlande lumineuse". At Christmas, "une guirlande" is also tinsel.', link: { fr: 'Quelle belle soirée !', en: 'What a lovely evening!' } },
    ],

    // Step 2: a short exchange in the scene. who: 'serveur' | 'vous'. pose: which pictures to show from that line on
    // (sj: table | ordering | cheers; serveur: tray | bow). Each step starts on { sj: 'table', serveur: 'tray' }.
    dialogue: [
      { who: 'serveur', fr: 'Bonsoir, madame. Bonsoir, monsieur !', en: 'Good evening, madam. Good evening, sir!', pose: { sj: 'ordering', serveur: 'tray' } },
      { who: 'vous', fr: "Bonsoir ! Deux coupes de champagne, s'il vous plaît.", en: 'Good evening! Two glasses of champagne, please.', tip: 'In a bar, a glass of champagne is "une coupe", whatever the shape of the glass.' },
      { who: 'serveur', fr: 'Voilà, madame.', en: 'Here you are, madam.', pose: { sj: 'table', serveur: 'bow' } },
      { who: 'vous', fr: 'Merci beaucoup !', en: 'Thank you very much!' },
      { who: 'serveur', fr: 'Je vous en prie. Bonne soirée !', en: "You're welcome. Have a lovely evening!" },
      { who: 'vous', fr: 'Santé !', en: 'Cheers!', pose: { sj: 'cheers' } },
    ],

    // Step 3: phrase cards.
    cards: [
      { emoji: '☀️', en: 'Hello / Good morning', fr: 'Bonjour', hint: 'bohn-ZHOOR', tip: 'Always say "Bonjour, madame / monsieur" as you walk into a shop. Skipping it comes across as rude in France.' },
      { emoji: '🌙', en: 'Good evening', fr: 'Bonsoir', hint: 'bohn-SWAHR', tip: 'Switch from bonjour to bonsoir at around 6 pm.' },
      { emoji: '💛', en: 'Thank you very much', fr: 'Merci beaucoup', hint: 'mair-SEE boh-KOO' },
      { emoji: '🎀', en: 'Please', fr: "S'il vous plaît", hint: 'seel voo PLAY', tip: 'Literally "if it pleases you". Add it to everything!' },
      { emoji: '😊', en: "You're welcome", fr: 'Je vous en prie', hint: 'zhuh vooz ahn PREE', tip: 'The polite reply to "merci". Casual version: "De rien".' },
      { emoji: '👋', en: 'Goodbye', fr: 'Au revoir', hint: 'oh ruh-VWAHR' },
      { emoji: '✨', en: 'Have a lovely evening', fr: 'Bonne soirée', hint: 'bun swah-RAY' },
      { emoji: '🥂', en: 'Cheers!', fr: 'Santé !', hint: 'sahn-TAY', tip: 'Look each other in the eye as you clink, or it\'s seven years of bad luck!' },
      { emoji: '🐢', en: "Sorry, I didn't catch that. Could you repeat, please?", fr: "Pardon, je n'ai pas bien compris. Pourriez-vous répéter, s'il vous plaît ?", hint: 'par-DOHN, zhuh nay pah byan kohm-PREE. poo-ree-AY voo ray-pay-TAY, seel voo PLAY', tip: 'The most useful sentence of the trip! Add « plus lentement » to ask them to go more slowly. And here, tap 🐢 to hear any phrase slowly.' },
    ],

    // Step 4: quiz. Review questions from earlier weeks are added automatically.
    quiz: [
      { type: 'tap', prompt: 'Touchez la lune.', en: 'Tap the right thing in the picture.', answer: 'lune', why: 'La lune: the moon. Time to say « bonsoir » !' },
      { type: 'choice', prompt: 'It\'s 8 pm. You walk into the restaurant. You say…', options: [
        { t: 'Bonjour !', why: '« Bonjour » is for the daytime, until about 6 pm. At 8 pm it sounds a little off.' },
        { t: 'Bonsoir !', why: 'After about 6 pm it\'s « bonsoir ». Add « madame » or « monsieur » to be extra polite.' },
        { t: 'Bonne nuit !', why: '« Bonne nuit » is only for saying goodnight, as you go to bed or leave very late. Never as a hello.' },
      ], answer: 'Bonsoir !' },
      { type: 'choice', prompt: 'Le serveur : « Voilà, madame. »', en: 'He sets down your champagne. You say…', options: [
        { t: 'Merci beaucoup !', why: 'Thank you very much! The natural reply when something is handed to you.' },
        { t: 'Au revoir !', why: '« Au revoir » is goodbye: for when you leave, not when your champagne arrives.' },
        { t: 'Je vous en prie.', why: '« Je vous en prie » means you\'re welcome. That\'s HIS line, after your « merci ».' },
      ], answer: 'Merci beaucoup !' },
      { type: 'order', prompt: 'Two glasses of champagne, please.', en: 'Tap the words in order.', words: ['Deux', 'coupes', 'de', 'champagne,', "s'il", 'vous', 'plaît.'], why: '« Une coupe » is the bar word for a glass of champagne. « S\'il vous plaît » always comes at the end, like "please".',
        hints: [
          { about: ['Deux', 'coupes'], t: 'Numbers go in front of the noun, just as in English: « deux coupes » (two glasses).' },
          { about: ['de', 'champagne,'], t: '« De » joins the glass to what\'s in it: « une coupe DE champagne », a glass OF champagne.' },
          { about: ["s'il", 'vous', 'plaît.'], t: '« S\'il vous plaît » is one fixed block, always s\'il · vous · plaît, and it goes at the end, like "please".' },
        ] },
      { type: 'choice', prompt: 'Someone says « Merci ! » to you. You reply…', options: [
        { t: 'Je vous en prie.', why: 'The polite "you\'re welcome". With friends, « de rien » works too.' },
        { t: "S'il vous plaît.", why: '« S\'il vous plaît » is please: for asking for something. (In Belgium it can also mean "you\'re welcome", but not in France.)' },
        { t: 'Santé !', why: '« Santé ! » is cheers: for clinking glasses.' },
      ], answer: 'Je vous en prie.' },
    ],

    // Step 5: saved to her "À dire" list, to say aloud later.
    sayIt: [
      { fr: 'Bonsoir, madame !', en: 'Good evening, madam!', hint: 'bohn-SWAHR, mah-DAM' },
      { fr: "Deux coupes de champagne, s'il vous plaît.", en: 'Two glasses of champagne, please.', hint: 'duh KOOP duh shahm-PAN-yuh, seel voo PLAY' },
      { fr: 'Merci beaucoup !', en: 'Thank you very much!', hint: 'mair-SEE boh-KOO' },
      { fr: 'Santé !', en: 'Cheers!', hint: 'sahn-TAY' },
      { fr: "Pardon, je n'ai pas bien compris. Pourriez-vous répéter, s'il vous plaît ?", en: "Sorry, I didn't catch that. Could you repeat, please?", hint: 'par-DOHN, zhuh nay pah byan kohm-PREE. poo-ree-AY voo ray-pay-TAY' },
    ],
  },

  {
    week: 1, unlock: '2027-01-01T08:00:00', scene: 'restaurant', music: 'accordion',
    titleFr: 'Au restaurant', titleEn: 'Menus, the bill and the bathroom',
    dialogueView: { x: 110, y: 150, w: 720, h: 450 },

    // a cosy village restaurant at night: each thing linked to a restaurant phrase. The scene shows the meal
    // (the menus, the bill and the card machine appear in the dialogue instead)
    objects: [
      { id: 'serveur', fr: 'le serveur', en: 'the waiter', hint: 'luh sair-VUR', tip: '« La carte » is the menu, the list of dishes. « Le menu » is a fixed-price set meal.', link: { fr: "Pourriez-vous nous apporter la carte, s'il vous plaît ?", en: 'Could you bring us the menu, please?' } },
      { id: 'casier', fr: 'le casier à vin', en: 'the wine rack', hint: 'luh kah-ZYAY ah VAN', link: { fr: 'Pourriez-vous nous apporter la carte des vins ?', en: 'Could you bring us the wine list?' } },
      { id: 'seau', fr: 'le seau à champagne', en: 'the champagne bucket', hint: 'luh SOH ah shahm-PAN-yuh', tip: '« Seau » sounds exactly like « sot » (silly) and « saut » (a jump). The context tells them apart.', link: { fr: 'Quel champagne rosé nous conseillez-vous ?', en: 'Which rosé champagne do you recommend?' } },
      { id: 'plat', fr: 'le plat', en: 'the dish', hint: 'luh PLAH', tip: '« Le plat principal » is the main course; « le plat du jour » is today\'s special. Tonight: la potée champenoise, the region\'s hearty stew.', link: { fr: 'Quel est votre plat préféré ici ?', en: 'What is your favourite dish here?' } },
      { id: 'ardoise', fr: "l'ardoise", g: 'f', en: 'the chalkboard', hint: 'lar-DWAHZ', tip: 'Bistros chalk the day\'s specials on it. Ask the waiter what he would pick.', link: { fr: "Qu'est-ce que vous nous conseillez ?", en: 'What do you recommend?' } },
      { id: 'carafe', fr: "la carafe d'eau", en: 'the jug of water', hint: 'lah kah-RAHF DOH', tip: 'Tap water is free by law. Ask for « une carafe d\'eau », not « une bouteille d\'eau ».', link: { fr: "Une carafe d'eau, s'il vous plaît.", en: 'A jug of tap water, please.' } },
      { id: 'bougie', fr: 'la bougie', en: 'the candle', hint: 'lah boo-ZHEE', tip: 'A candlelit dinner is « un dîner aux chandelles ».', link: { fr: 'Une table pour deux, s\'il vous plaît.', en: 'A table for two, please.' } },
      { id: 'porte', fr: 'la porte des toilettes', en: 'the door to the toilets', hint: 'lah PORT day twah-LET', link: { fr: "Où sont les toilettes, s'il vous plaît ?", en: 'Where are the toilets, please?' } },
      { id: 'caisse', fr: 'la caisse', en: 'the till', hint: 'lah KESS', link: { fr: 'On paie à la caisse ou à table ?', en: 'Do we pay at the till or at the table?' } },
      { id: 'table', fr: 'la table', en: 'the table', hint: 'lah TAH-bl', link: { fr: "Tout était délicieux ! L'addition, s'il vous plaît.", en: 'Everything was delicious! The bill, please.' } },
      { id: 'chaise', fr: 'la chaise', en: 'the chair', hint: 'lah SHEZ', link: { fr: 'Pardon, cette chaise est libre ?', en: 'Excuse me, is this chair free?' } },
    ],

    // poses: sj menus | asking | meal | bill; serveur bow | rose | machine. The scene's default is { sj: 'meal', serveur: 'bow' }
    dialogue: [
      { who: 'serveur', fr: 'Bonsoir ! Vous avez choisi ?', en: 'Good evening! Have you chosen?', pose: { sj: 'menus', serveur: 'bow' } },
      { who: 'vous', fr: "Pas encore. Pourriez-vous nous apporter la carte des vins, s'il vous plaît ?", en: 'Not yet. Could you bring us the wine list, please?', pose: { sj: 'asking' }, tip: '« La carte des vins » is the wine list. « La carte » alone is the menu of dishes, and « le menu » is a fixed-price set meal.' },
      { who: 'serveur', fr: 'Bien sûr, la voici.', en: 'Of course, here it is.' },
      { who: 'vous', fr: 'Merci. Quel champagne rosé nous conseillez-vous ?', en: 'Thank you. Which rosé champagne do you recommend?' },
      { who: 'serveur', fr: 'Le rosé de Veuve Clicquot, madame. Il est délicieux.', en: 'The Veuve Clicquot rosé, madam. It\'s delicious.', pose: { serveur: 'rose' } },
      { who: 'vous', fr: 'Parfait ! Et quel est votre plat préféré ici ?', en: 'Perfect! And what is your favourite dish here?' },
      { who: 'serveur', fr: 'La potée champenoise, sans hésiter !', en: 'The potée champenoise, without a doubt!', tip: 'La potée champenoise: the region\'s hearty stew of pork, sausage, cabbage and vegetables.' },
      { who: 'vous', fr: "Alors deux potées, s'il vous plaît !", en: 'Two potées then, please!' },
      { who: 'serveur', fr: 'Voilà. Bon appétit !', en: 'Here you are. Enjoy your meal!', pose: { sj: 'meal', serveur: 'bow' }, tip: 'Reply with a simple « Merci ! ».' },
      { who: 'vous', fr: 'Excusez-moi, où sont les toilettes ?', en: 'Excuse me, where are the toilets?' },
      { who: 'serveur', fr: 'Au fond, à droite.', en: 'At the back, on the right.', tip: 'Look at the picture: the door at the back, on the right!' },
      { who: 'vous', fr: "Tout était délicieux ! L'addition, s'il vous plaît.", en: 'Everything was delicious! The bill, please.' },
      { who: 'serveur', fr: 'Merci ! Vous payez par carte ?', en: 'Thank you! Are you paying by card?', pose: { sj: 'bill' } },
      { who: 'vous', fr: 'Oui, par carte. Vous pouvez apporter la machine ?', en: 'Yes, by card. Can you bring the card machine?', tip: 'In France the waiter brings the card machine to the table. It\'s called « la machine » or « le terminal ».' },
      { who: 'serveur', fr: "Je vous l'apporte tout de suite.", en: "I'll bring it right away.", pose: { serveur: 'machine' } },
    ],

    cards: [
      { emoji: '📜', en: 'The menu, please', fr: "La carte, s'il vous plaît.", hint: 'lah KART, seel voo PLAY', tip: '« Le menu » is the fixed-price set meal. The full list of dishes is « la carte ».' },
      { emoji: '🌸', en: 'Which rosé champagne do you recommend?', fr: 'Quel champagne rosé nous conseillez-vous ?', hint: 'kel shahm-PAN-yuh roh-ZAY noo kohn-say-AY VOO', tip: 'In Champagne, sparkling rosé is champagne rosé. Elsewhere in France, ask for « un crémant rosé ».' },
      { emoji: '🚻', en: 'Where are the toilets, please?', fr: "Où sont les toilettes, s'il vous plaît ?", hint: 'oo sohn lay twah-LET', tip: '« Les toilettes » is always plural. You may also see « WC ».' },
      { emoji: '💧', en: 'A jug of tap water, please', fr: "Une carafe d'eau, s'il vous plaît.", hint: 'ün kah-RAHF DOH', tip: 'Tap water is free by law. « Une bouteille d\'eau » gets you bottled water, and a bill for it.' },
      { emoji: '😋', en: 'Everything was delicious', fr: 'Tout était délicieux !', hint: 'toot ay-TAY day-lee-SYUH' },
      { emoji: '🧾', en: 'The bill, please', fr: "L'addition, s'il vous plaît.", hint: 'lah-dee-SYOHN, seel voo PLAY', tip: 'The waiter won\'t bring it until you ask: rushing you would be rude.' },
      { emoji: '💳', en: 'By card. Can you bring the machine?', fr: 'Par carte. Vous pouvez apporter la machine ?', hint: 'par KART. voo poo-VAY ah-por-TAY lah mah-SHEEN' },
      { emoji: '☀️', en: 'Can we sit outside?', fr: "On peut s'asseoir en terrasse ?", hint: 'ohn puh sah-SWAHR ahn teh-RASS' },
    ],

    quiz: [
      { type: 'choice', prompt: 'You want to see the list of dishes. You ask for…', options: [
        { t: 'La carte', why: 'The full list of dishes. « La carte, s\'il vous plaît. »' },
        { t: 'Le menu', why: '« Le menu » is a fixed-price set meal (starter, main, dessert). Lovely if you want it, but it isn\'t the whole list.' },
        { t: "L'addition", why: '« L\'addition » is the bill, for the end of the meal.' },
      ], answer: 'La carte' },
      // v1.08: four phrases moved here from the flip cards (the user finds putting words in order the most helpful)
      { type: 'order', prompt: 'Could you bring us the wine list?', en: 'Tap the words in order.', words: ['Pourriez-vous', 'nous', 'apporter', 'la', 'carte', 'des', 'vins ?'], why: '« Pourriez-vous… ? » (could you…?) is the politest way to ask for anything. « La carte des vins » is the wine list.',
        hints: [
          { about: ['Pourriez-vous'], t: 'A polite question can start with the verb itself: « Pourriez-vous… ? » (Could you…?).' },
          { about: ['nous', 'apporter'], t: '« Nous » (us) goes BEFORE the verb it belongs to: « nous apporter », bring us. Never « apporter nous ».' },
          { about: ['la', 'carte', 'des', 'vins ?'], t: 'The thing you want comes last: « la carte des vins », the list OF THE wines (« des » = of the).' },
        ] },
      { type: 'tap', prompt: 'Touchez le seau à champagne.', en: 'Tap the right thing in the picture.', answer: 'seau', why: 'Le seau à champagne, keeping the rosé cold.' },
      { type: 'order', prompt: 'What is your favourite dish here?', en: 'Tap the words in order.', words: ['Quel', 'est', 'votre', 'plat', 'préféré', 'ici ?'], why: 'Like the colour in « champagne rosé », « préféré » comes after the noun: « votre plat préféré ».',
        hints: [
          { about: ['Quel', 'est'], t: '« Quel est… ? » (What is…?) opens the question.' },
          { about: ['votre', 'plat', 'préféré'], t: 'Most describing words come AFTER the noun in French: « plat préféré » (dish favourite). « Votre » (your) stays in front.' },
          { about: ['ici ?'], t: '« Ici » (here) goes at the very end, as in English.' },
        ] },
      { type: 'order', prompt: 'Where are the toilets, please?', en: 'Tap the words in order.', words: ['Où', 'sont', 'les', 'toilettes,', "s'il", 'vous', 'plaît ?'], why: '« Les toilettes » is plural, so it\'s « où SONT », not « où est ».',
        hints: [
          { about: ['Où', 'sont'], t: 'The question word first, then the verb: « Où sont… ? » (Where are…?).' },
          { about: ['les', 'toilettes,'], t: '« Les » (the) sits right in front of its noun: « les toilettes ».' },
          { about: ["s'il", 'vous', 'plaît ?'], t: '« S\'il vous plaît » is one fixed block, always s\'il · vous · plaît, and it goes at the end.' },
        ] },
      { type: 'tap', prompt: 'Au fond, à droite. Touchez la porte des toilettes.', en: 'At the back, on the right. Tap the right thing in the picture.', answer: 'porte', why: 'La porte des toilettes: at the back, on the right, just as the waiter said.' },
      { type: 'tap', prompt: 'Touchez la caisse.', en: 'Tap the right thing in the picture.', answer: 'caisse', why: 'La caisse: the till. « On paie à la caisse ou à table ? »' },
      { type: 'order', prompt: 'Do we pay at the till or at the table?', en: 'Tap the words in order.', words: ['On', 'paie', 'à', 'la', 'caisse', 'ou', 'à', 'table ?'], why: '« On » (one / we) is how the French say "we" in everyday speech. « À table » needs no « la ».',
        hints: [
          { about: ['On', 'paie'], t: 'Who, then the verb: « On paie » (we pay). A spoken French question can keep the normal order and simply rise in tone at the end.' },
          { about: ['à', 'la', 'caisse', 'ou', 'table ?'], t: 'Two places joined by « ou » (or): « à la caisse » OU « à table ». Each place gets its own « à ».' },
        ] },
      { type: 'order', prompt: 'What do you recommend?', en: 'Tap the words in order.', words: ["Qu'est-ce", 'que', 'vous', 'nous', 'conseillez ?'], why: '« Qu\'est-ce que » starts a "what" question. « Vous nous conseillez » = you advise us.',
        hints: [
          { about: ["Qu'est-ce", 'que'], t: '« Qu\'est-ce que » (what) always opens the question, as one block.' },
          { about: ['vous', 'nous', 'conseillez ?'], t: 'First who is doing it (« vous », you), then who it\'s for (« nous », us), then the verb: « vous nous conseillez », you advise us. « Nous » and « vous » as the object sit BEFORE the verb, not after it as in English.' },
        ] },
      { type: 'choice', prompt: 'You would like free tap water. You say…', options: [
        { t: "Une carafe d'eau, s'il vous plaît.", why: 'A jug of tap water: free in every French restaurant.' },
        { t: "Une bouteille d'eau, s'il vous plaît.", why: 'That gets you a bottle of mineral water, and it goes on the bill. Fine if you want sparkling (« de l\'eau gazeuse »).' },
        { t: "Un verre de vin, s'il vous plaît.", why: 'A glass of wine! Also a good idea, but not water.' },
      ], answer: "Une carafe d'eau, s'il vous plaît." },
      { type: 'choice', prompt: 'The meal is over. To get the bill you say…', options: [
        { t: "L'addition, s'il vous plaît.", why: 'The bill, please. The waiter won\'t bring it until you ask.' },
        { t: "La carte, s'il vous plaît.", why: 'That brings the menu back. Handy if you want dessert!' },
        { t: 'Tout était délicieux !', why: 'Everything was delicious! A lovely thing to say, but it doesn\'t ask for the bill. Say it first, then ask.' },
      ], answer: "L'addition, s'il vous plaît." },
      { type: 'choice', prompt: 'Le serveur : « Vous payez par carte ? »', en: 'You\'ll pay by card. You say…', options: [
        { t: 'Oui, vous pouvez apporter la machine ?', why: 'Yes, can you bring the machine? He\'ll bring the card terminal to your table.' },
        { t: 'On paie à la caisse ?', why: 'Do we pay at the till? A good question in a café, but he has just offered to take your card at the table.' },
        { t: 'Je vous en prie.', why: 'You\'re welcome: the reply to « merci », not to a question.' },
      ], answer: 'Oui, vous pouvez apporter la machine ?' },
      { type: 'order', prompt: 'Which rosé champagne do you recommend?', en: 'Tap the words in order.', words: ['Quel', 'champagne', 'rosé', 'nous', 'conseillez-vous ?'], why: 'In French the colour comes after the noun: « champagne rosé », « vin rouge ». « Nous conseillez-vous » = do you advise us.',
        hints: [
          { about: ['champagne', 'rosé'], t: 'Colours come AFTER the noun in French: « champagne rosé », « vin rouge », « robe rose ». (Only a few short, common words like « bon », « beau », « petit » go before.)' },
          { about: ['Quel'], t: '« Quel » (which) goes right in front of the noun it asks about: « Quel champagne… ? »' },
          { about: ['nous', 'conseillez-vous ?'], t: '« Nous » (us) sits BEFORE the verb: « nous conseillez-vous ? », do you advise us? The « -vous » is joined on with a dash because the question is turned around.' },
        ] },
    ],

    sayIt: [
      { fr: "Pourriez-vous nous apporter la carte, s'il vous plaît ?", en: 'Could you bring us the menu, please?', hint: 'poo-ree-AY voo nooz ah-por-TAY lah KART, seel voo PLAY' },
      { fr: 'Quel champagne rosé nous conseillez-vous ?', en: 'Which rosé champagne do you recommend?', hint: 'kel shahm-PAN-yuh roh-ZAY noo kohn-say-AY VOO' },
      { fr: 'Quel est votre plat préféré ici ?', en: 'What is your favourite dish here?', hint: 'kel ay VOH-truh plah pray-fay-RAY ee-SEE' },
      { fr: "Où sont les toilettes, s'il vous plaît ?", en: 'Where are the toilets, please?', hint: 'oo sohn lay twah-LET' },
      { fr: "Tout était délicieux ! L'addition, s'il vous plaît.", en: 'Everything was delicious! The bill, please.', hint: 'toot ay-TAY day-lee-SYUH. lah-dee-SYOHN' },
      { fr: 'On paie à la caisse ou à table ?', en: 'Do we pay at the till or at the table?', hint: 'ohn PAY ah lah KESS oo ah TAH-bl' },
      { fr: 'Par carte. Vous pouvez apporter la machine ?', en: 'By card. Can you bring the machine?', hint: 'par KART. voo poo-VAY ah-por-TAY lah mah-SHEEN' },
    ],
  },

  {
    week: 2, unlock: '2027-01-08T08:00:00', scene: 'marche', music: 'accordion',
    titleFr: 'Au marché', titleEn: 'Days, times and shopping',
    dialogueView: { x: 50, y: 145, w: 760, h: 475 },

    // a Saturday-morning market on the village square
    objects: [
      { id: 'marchande', fr: 'la marchande', en: 'the stallholder', hint: 'lah mar-SHAHND', tip: 'A man would be « le marchand ».', link: { fr: "C'est combien, s'il vous plaît ?", en: 'How much is it, please?' } },
      { id: 'fraises', fr: 'les fraises', g: 'f', en: 'the strawberries', hint: 'lay FREZ', tip: 'One strawberry is « une fraise ». Fruit is often sold by the kilo, or by the punnet: « une barquette ».', link: { fr: "Je voudrais un kilo de fraises, s'il vous plaît.", en: "I'd like a kilo of strawberries, please." } },
      { id: 'cerises', fr: 'les cerises', g: 'f', en: 'the cherries', hint: 'lay suh-REEZ', tip: 'June is cherry season in France.', link: { fr: 'Elles sont de la région ?', en: 'Are they local?' } },
      { id: 'fromage', fr: 'le fromage', en: 'the cheese', hint: 'luh froh-MAHZH', tip: 'The local cheeses here are Chaource and Langres. Ask for « un morceau » (a piece).', link: { fr: 'Je peux goûter ?', en: 'May I taste?' } },
      { id: 'fleurs', fr: 'les fleurs', g: 'f', en: 'the flowers', hint: 'lay FLUR', tip: 'These are « des pivoines », peonies, in season in June.', link: { fr: "Un bouquet de pivoines, s'il vous plaît.", en: 'A bunch of peonies, please.' } },
      { id: 'balance', fr: 'la balance', en: 'the scales', hint: 'lah bah-LAHNS', tip: 'Prices are often per kilo: « six euros le kilo ».', link: { fr: 'Ça fait combien ?', en: 'How much does that come to?' } },
      { id: 'panier', fr: 'le panier', en: 'the basket', hint: 'luh pan-YAY', link: { fr: "C'est tout, merci.", en: "That's all, thank you." } },
      { id: 'parasol', fr: 'le parasol', en: 'the sunshade', hint: 'luh pah-rah-SOL', link: { fr: "Il fait beau aujourd'hui !", en: "It's lovely weather today!" } },
      { id: 'horloge', fr: "l'horloge", g: 'f', en: 'the clock', hint: 'lor-LOZH', tip: 'It shows ten o\'clock: « Il est dix heures ». The h is silent, and « dix heures » runs together: dee-ZUR.', link: { fr: 'Quelle heure est-il ?', en: 'What time is it?' } },
      { id: 'mairie', fr: 'la mairie', en: 'the town hall', hint: 'lah meh-REE', tip: 'Every French village has one, with the flag outside and « Liberté, Égalité, Fraternité » over the door.', link: { fr: 'Excusez-moi, où est la mairie ?', en: 'Excuse me, where is the town hall?' } },
      { id: 'affiche', fr: "l'affiche", g: 'f', en: 'the notice', hint: 'lah-FEESH', tip: 'It says: market every Saturday, 8 am to 1 pm, and Wednesday mornings. French uses the 24-hour clock for times like this: 13h = 1 pm.', link: { fr: "Le marché, c'est quel jour ?", en: 'Which day is the market?' } },
    ],

    // poses: sj browsing | asking | paying | tasting; marchande rest | hello | bag | clock. Default { sj: 'browsing', marchande: 'rest' }
    dialogue: [
      { who: 'marchande', fr: 'Bonjour, madame ! Bonjour, monsieur !', en: 'Good morning, madam! Good morning, sir!', pose: { sj: 'browsing', marchande: 'hello' } },
      { who: 'vous', fr: 'Bonjour, madame ! Elles sont belles, vos fraises !', en: 'Good morning! Your strawberries look lovely!', pose: { sj: 'asking', marchande: 'rest' }, tip: '« Elles » (they) because « les fraises » are feminine.' },
      { who: 'marchande', fr: 'Ce sont des fraises de la région. Elles sont délicieuses !', en: "They're local strawberries. They're delicious!" },
      { who: 'vous', fr: "C'est combien, le kilo ?", en: 'How much is a kilo?' },
      { who: 'marchande', fr: 'Six euros le kilo.', en: 'Six euros a kilo.', tip: '« Le kilo » = per kilo. €6.50 is said « six euros cinquante ».' },
      { who: 'vous', fr: "Je voudrais un kilo de fraises, s'il vous plaît.", en: "I'd like a kilo of strawberries, please." },
      { who: 'marchande', fr: 'Voilà ! Et avec ceci ?', en: 'Here you are! Anything else?', pose: { marchande: 'bag' }, tip: 'Every stallholder in France asks « Et avec ceci ? ». If you have everything, answer « C\'est tout, merci. »' },
      { who: 'vous', fr: 'Un bouquet de pivoines aussi. Ça fait combien ?', en: 'A bunch of peonies too. How much does that come to?' },
      { who: 'marchande', fr: "Ça fait quinze euros, s'il vous plaît.", en: "That's fifteen euros, please.", pose: { sj: 'paying', marchande: 'rest' } },
      { who: 'vous', fr: "Voilà. Le marché, c'est tous les samedis ?", en: 'Here you are. Is the market every Saturday?' },
      { who: 'marchande', fr: 'Oui, tous les samedis, de huit heures à une heure. Et le mercredi matin aussi !', en: 'Yes, every Saturday, from eight o\'clock to one. And Wednesday mornings too!', pose: { marchande: 'clock' }, tip: 'Days of the week have no capital in French: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.' },
      { who: 'vous', fr: 'Et quelle heure est-il ?', en: 'And what time is it?' },
      { who: 'marchande', fr: 'Il est dix heures. Vous avez le temps ! Bonne journée !', en: "It's ten o'clock. You have time! Have a lovely day!" },
      { who: 'vous', fr: 'Merci, bonne journée ! Mmm… elles sont délicieuses !', en: 'Thank you, have a lovely day! Mmm… they\'re delicious!', pose: { sj: 'tasting', marchande: 'hello' } },
    ],

    cards: [
      { emoji: '💶', en: 'How much is it?', fr: "C'est combien ?", hint: 'say kohm-BYAN', tip: 'For a total: « Ça fait combien ? » (how much does that come to?).' },
      { emoji: '🍓', en: "I'd like a kilo of strawberries, please", fr: "Je voudrais un kilo de fraises, s'il vous plaît.", hint: 'zhuh voo-DRAY uhn kee-LOH duh FREZ', tip: '« Je voudrais » (I would like) is much politer than « je veux » (I want).' },
      { emoji: '➕', en: 'Anything else?', fr: 'Et avec ceci ?', hint: 'ay ah-VEK suh-SEE', tip: "You'll hear it at every stall and in every shop." },
      { emoji: '✋', en: "That's all, thank you", fr: "C'est tout, merci.", hint: 'say TOO, mair-SEE' },
      { emoji: '🕙', en: 'What time is it?', fr: 'Quelle heure est-il ?', hint: 'kel UR ay-TEEL', tip: 'The answer: « Il est dix heures » (it\'s ten o\'clock). « Midi » is noon.' },
      { emoji: '📅', en: 'The market is on Saturdays', fr: "Le marché, c'est le samedi.", hint: 'luh mar-SHAY, say luh sahm-DEE', tip: '« Le samedi » = on Saturdays, every week. « Samedi » alone = this Saturday. The days: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.' },
      { emoji: '☀️', en: "It's June", fr: 'Nous sommes en juin.', hint: 'noo SUM ahn ZHWAN', tip: 'Months take « en » and no capital: janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre.' },
      { emoji: '🎂', en: 'My birthday is in August', fr: 'Mon anniversaire est en août.', hint: 'mohn nah-nee-vair-SAIR ay ahn OOT', tip: '« Août » is said « oot » (or just « oo »): the a is silent.' },
    ],

    quiz: [
      { type: 'tap', prompt: "Touchez l'horloge.", en: 'Tap the right thing in the picture.', answer: 'horloge', why: "L'horloge. Il est dix heures !" },
      { type: 'choice', prompt: 'Quelle heure est-il ?', en: 'Look at the clock on the town hall.', options: [
        { t: 'Il est dix heures.', why: "It's ten o'clock. Both hands say so!" },
        { t: 'Il est deux heures.', why: 'Two o\'clock: « deux » (duh) and « dix » (deess) are easy to mix up. Look again at the short hand.' },
        { t: 'Il est dix euros.', why: 'Ten euros! « Heures » (urr) and « euros » (uh-ROH) sound alike, but that\'s a price, not a time.' },
      ], answer: 'Il est dix heures.' },
      { type: 'order', prompt: "I'd like a kilo of strawberries, please.", en: 'Tap the words in order.', words: ['Je', 'voudrais', 'un', 'kilo', 'de', 'fraises,', "s'il", 'vous', 'plaît.'], why: 'After an amount it\'s always « de »: un kilo DE fraises, un bouquet DE pivoines.',
        hints: [
          { about: ['Je', 'voudrais'], t: 'Start with who wants it: « Je voudrais » (I would like), the polite way to ask for anything.' },
          { about: ['un', 'kilo', 'de', 'fraises,'], t: 'The amount first, then « de », then the food: « un kilo DE fraises », a kilo OF strawberries. After an amount it\'s always « de », never « des ».' },
          { about: ["s'il", 'vous', 'plaît.'], t: '« S\'il vous plaît » is one fixed block, always s\'il · vous · plaît, and it goes at the end.' },
        ] },
      { type: 'choice', prompt: 'La marchande : « Et avec ceci ? »', en: 'You have everything you need. You say…', options: [
        { t: "C'est tout, merci.", why: "That's all, thank you. The natural answer." },
        { t: "C'est combien ?", why: 'How much is it? Useful, but she asked if you want anything else.' },
        { t: 'Je voudrais des cerises.', why: "I'd like some cherries: the answer if you DO want something else!" },
      ], answer: "C'est tout, merci." },
      { type: 'tap', prompt: 'Touchez les cerises.', en: 'Tap the right thing in the picture.', answer: 'cerises', why: 'Les cerises, the first of June.' },
      { type: 'order', prompt: 'The market is every Saturday.', en: 'Tap the words in order.', words: ['Le', 'marché,', "c'est", 'tous', 'les', 'samedis.'], why: '« Tous les… » = every: tous les samedis, tous les jours (every day).',
        hints: [
          { about: ['Le', 'marché,'], t: 'Say what you\'re talking about first, then « c\'est »: « Le marché, c\'est… ». Very common in spoken French.' },
          { about: ["c'est"], t: '« C\'est » (it is) comes straight after the comma.' },
          { about: ['tous', 'les', 'samedis.'], t: '« Tous les… » = every: « tous les samedis » (every Saturday). And days take no capital in French.' },
        ] },
      { type: 'choice', prompt: 'Which day comes after vendredi?', en: 'Les jours de la semaine.', options: [
        { t: 'samedi', why: 'Saturday: market day! The week runs lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.' },
        { t: 'dimanche', why: 'Sunday comes after samedi. Vendredi is Friday.' },
        { t: 'mercredi', why: 'Wednesday, the other market day here. It comes before vendredi.' },
      ], answer: 'samedi' },
      { type: 'choice', prompt: 'Your birthday is in August. You say…', options: [
        { t: 'Mon anniversaire est en août.', why: 'My birthday is in August. Months take « en ».' },
        { t: 'Mon anniversaire est en avril.', why: '« Avril » is April. August is « août », said « oot ».' },
        { t: 'Mon anniversaire est le août.', why: 'With a month on its own it\'s « en »: en août, en juin. « Le » is for a date: le 10 août.' },
      ], answer: 'Mon anniversaire est en août.' },
      { type: 'order', prompt: 'My birthday is in August.', en: 'Tap the words in order.', words: ['Mon', 'anniversaire', 'est', 'en', 'août.'], why: '« Mon anniversaire » (my birthday) is masculine, so « mon ». Months take « en ».',
        hints: [
          { about: ['Mon', 'anniversaire'], t: '« Mon » (my) goes in front: « mon anniversaire ». It\'s « mon », not « ma », because « anniversaire » is masculine.' },
          { about: ['est', 'en', 'août.'], t: 'Then the verb « est » (is), then « en » + the month: « en août » (in August).' },
        ] },
    ],

    sayIt: [
      { fr: "Bonjour, madame ! C'est combien, le kilo ?", en: 'Good morning! How much is a kilo?', hint: 'bohn-ZHOOR, mah-DAM ! say kohm-BYAN, luh kee-LOH' },
      { fr: "Je voudrais un kilo de fraises, s'il vous plaît.", en: "I'd like a kilo of strawberries, please.", hint: 'zhuh voo-DRAY uhn kee-LOH duh FREZ' },
      { fr: "C'est tout, merci. Ça fait combien ?", en: "That's all, thanks. How much does that come to?", hint: 'say TOO, mair-SEE. sah fay kohm-BYAN' },
      { fr: 'Quelle heure est-il ?', en: 'What time is it?', hint: 'kel UR ay-TEEL' },
      { fr: "Le marché, c'est quel jour ?", en: 'Which day is the market?', hint: 'luh mar-SHAY, say kel ZHOOR' },
      { fr: 'Mon anniversaire est en août.', en: 'My birthday is in August.', hint: 'mohn nah-nee-vair-SAIR ay ahn OOT' },
    ],
  },
];
