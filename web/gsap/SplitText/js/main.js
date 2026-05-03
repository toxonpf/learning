gsap.registerPlugin(SplitText);

let split = SplitText.create('#text', {
    type: 'chars, words, lines',
    wordsClass: 'word',
});

gsap.from(split.chars, {
    stagger: {
        each: 0.1,
        from: 'start',
    },

    autoAlpha: 0,
    yPercent: '50',
});