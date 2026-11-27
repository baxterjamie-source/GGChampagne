/* Lesson content: one object per week. Engine: lessons.js. Rules: reveal_app/FRENCH_LESSONS.md.
   SECRECY: everything in this file ships to her phone. Only add a lesson here if it can't spoil a locked
   reveal, or once lessons sit behind the reveal gate (not built yet). */
'use strict';

const LESSONS = [
  {
    week: 0, unlock: '2026-12-25T08:00:00', scene: 'terrasse', music: 'accordion',
    titleFr: 'Bonsoir !', titleEn: 'Greetings and thank-yous',
    dialogueView: { x: 270, y: 150, w: 730, h: 456 },

    // Step 1: the scene. Tappable things, each linked to a phrase.
    objects: [
      { id: 'soleil', fr: 'le soleil', en: 'the sun', hint: 'luh soh-LAY', link: { fr: 'Bonjour !', en: 'Hello! (in the daytime)' } },
      { id: 'lune', fr: 'la lune', en: 'the moon', hint: 'lah LÜN', tip: 'The French "u": round your lips to say "oo", then say "ee".', link: { fr: 'Bonsoir !', en: 'Good evening!' } },
      { id: 'serveur', fr: 'le serveur', en: 'the waiter', hint: 'luh sair-VUR', link: { fr: "Monsieur, s'il vous plaît !", en: 'Excuse me! (to call the waiter, never "garçon")' } },
      { id: 'table', fr: 'la table', en: 'the table', hint: 'lah TAH-bl', link: { fr: "Une table pour deux, s'il vous plaît.", en: 'A table for two, please.' } },
      { id: 'chaise', fr: 'la chaise', en: 'the chair', hint: 'lah SHEZ' },
      { id: 'bouteille', fr: 'la bouteille', en: 'the bottle', hint: 'lah boo-TAY', link: { fr: 'Une bouteille de champagne', en: 'A bottle of champagne' } },
      { id: 'verre', fr: 'la flûte', en: 'the champagne flute', hint: 'lah FLÜT', link: { fr: 'Santé !', en: 'Cheers! (literally "health")' } },
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
    ],

    // Step 4: quiz. Review questions from earlier weeks are added automatically.
    quiz: [
      { type: 'tap', prompt: 'Touchez la lune.', en: 'Tap the right thing in the picture.', answer: 'lune', why: 'La lune: the moon. Time to say « bonsoir » !' },
      { type: 'choice', prompt: 'It\'s 8 pm. You walk into the restaurant. You say…', options: ['Bonjour !', 'Bonsoir !', 'Bonne nuit !'], answer: 'Bonsoir !', why: 'After about 6 pm it\'s « bonsoir ». « Bonne nuit » is only for going to bed.' },
      { type: 'choice', prompt: 'Le serveur : « Voilà, madame. »', en: 'He sets down your champagne. You say…', options: ['Merci beaucoup !', 'Au revoir !', 'Je vous en prie.'], answer: 'Merci beaucoup !' },
      { type: 'order', prompt: 'Two glasses of champagne, please.', en: 'Tap the words in order.', words: ['Deux', 'coupes', 'de', 'champagne,', "s'il", 'vous', 'plaît.'] },
      { type: 'choice', prompt: 'Someone says « Merci ! » to you. You reply…', options: ['Je vous en prie.', "S'il vous plaît.", 'Santé !'], answer: 'Je vous en prie.' },
    ],

    // Step 5: saved to her "À dire" list, to say aloud later.
    sayIt: [
      { fr: 'Bonsoir, madame !', en: 'Good evening, madam!', hint: 'bohn-SWAHR, mah-DAM' },
      { fr: "Deux coupes de champagne, s'il vous plaît.", en: 'Two glasses of champagne, please.', hint: 'duh KOOP duh shahm-PAN-yuh, seel voo PLAY' },
      { fr: 'Merci beaucoup !', en: 'Thank you very much!', hint: 'mair-SEE boh-KOO' },
      { fr: 'Santé !', en: 'Cheers!', hint: 'sahn-TAY' },
    ],
  },
];
