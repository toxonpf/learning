const relBlockButton = document.querySelector('.head-kids__user');
const buttonBlock = document.createElement('div');

function button() {
    buttonBlock.innerHTML = '<center>get letter</center>';
    buttonBlock.style.background = "#ff0090";
    buttonBlock.style.color = "#FFF";
    buttonBlock.style.fontSize = "20px";
    buttonBlock.style.cursor = "pointer";

    relBlockButton.appendChild(buttonBlock);
}
button();

function phormLetter() {
    const songs = document.querySelectorAll(".typo-track");
    const clearLetter = [];
    var i = 0;
    songs.forEach((element) => {
        let songText = element.innerText;
        let floatSong = songText.replace(/\n/g, " ");

        i++
        if (i % 2) {
            clearLetter.push(floatSong);
        }
    });
    return clearLetter;
}

buttonBlock.addEventListener('click', () => {
    window.scrollTo({
        top: 10000,
        left: 0,
        behavior: 'smooth'
    });

    setTimeout(() => {
        var newWin = window.open("about:blank", "hello", "width=500,height=700");
        newWin.document.body.style.backgroundColor = "#aaa";
        phormLetter().forEach(el => {
            let divBlock = document.createElement('div');
            divBlock.innerText = el;
            newWin.document.body.appendChild(divBlock);
        });
    }, 1000);
});