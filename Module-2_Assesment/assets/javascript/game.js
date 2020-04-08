import ".assets/css/style.css";
import losing from ".assets/audio/losing.mp3";

const alphaBetKeyMappings = {
  65: "a",
  66: "b",
  67: "c",
  68: "d",
  69: "e",
  70: "f",
  71: "g",
  72: "h",
  73: "i",
  74: "j",
  75: "k",
  76: "l",
  77: "m",
  78: "n",
  79: "o",
  80: "p",
  81: "q",
  82: "r",
  83: "s",
  84: "t",
  85: "u",
  86: "v",
  87: "w",
  88: "x",
  89: "y",
  90: "z"
};

function Game() {
  let initialState = {
    hasWon: false,
    hasStarted: false,
    round: 1,
    maxRounds: null,
    roundData: [
      {
        round: 1,
        word: "kobe bryant",
        image: import("./assets/imgs/kobe.jpg"),
        audio: import("./assets/audio/kobe.mp3"),
        colorAccent: "#f9a004",
        secondaryAccent: "#6E61BC"
      },
      {
        round: 2,
        word: "chicago bulls",
        image: import("./assets/imgs/bulls.jpg"),
        audio: import("./assets/audio/bulls.mp3"),
        colorAccent: "#d91917",
        secondaryAccent: "#110107"
      },
      {
        round: 3,
        word: "slam dunk",
        image: import("./assets/imgs/dunk.jpg"),
        audio: import("./assets/audio/dunk.mp3"),
        colorAccent: "#EC6F21",
        secondaryAccent: "#1C1408"
      },
      {
        round: 4,
        word: "spud webb",
        image: import("./assets/imgs/spud.jpg"),
        audio: import("./assets/audio/spud.mp3"),
        colorAccent: "#C02427",
        secondaryAccent: "#ECB547"
      },
      {
        round: 5,
        word: "bill russell",
        image: import("./assets/imgs/russell.jpg"),
        audio: "",
        colorAccent: "#20503A",
        secondaryAccent: "#0F784E"
      }
    ],
    wins: 0,
    currentWord: null,
    guessesRemaining: 12,
    lettersGuessed: [],
    lettersLeft: [],
    currentSound: false,
    processing: false
  };

  let gameState = {
    ...initialState
  };

  /**
   * No type checking for object but should be there
   */
  const setState = (state = {}) => {
    gameState = {
      ...gameState,
      ...state
    };

    console.log("state changed", state);
    return gameState;
  };

  const isPromise = value => Boolean(value && typeof value.then === "function");

  const generateWordHtml = wordLetterArray => {
    let html = "";

    for (let i = 0; i < wordLetterArray.length; i++) {
      const letter = wordLetterArray[i];

      html +=
        letter.trim() === ""
          ? '<div class="spacer"></div>'
          : `<div class="letter-wrap letter-${letter} not-showing">
              <span class="underscore">__</span>
              <span class="letter">${letter}</span>
             </div>`;
    }

    let div = document.createElement("div");
    div.classList.add("word-word-wrap");
    div.insertAdjacentHTML("beforeend", html);

    let currentWordWrap = document.querySelector(".current-word");
    currentWordWrap.innerHTML = "";
    currentWordWrap.append(div);
  };

  const showLetters = letter => {
    let lettersOnDOM = document.querySelectorAll(`.letter-${letter}`);

    if (lettersOnDOM.length) {
      for (let i = 0; i < lettersOnDOM.length; i++) {
        let domEl = lettersOnDOM[i];
        domEl.classList.remove("not-showing");
        domEl.classList.add("showing");
      }
    }
  };

  const findCorrectLetter = (word, letter) => {
    let searchInWord = word.search(letter);

    const [wordIndex, isLetterFound] = [searchInWord, searchInWord !== -1];

    return [wordIndex, isLetterFound];
  };

  const removeLetters = letter => {
    const { lettersLeft } = gameState;
    let letters = lettersLeft.filter(letterToCheck => letterToCheck !== letter);

    setState({
      lettersLeft: letters
    });
  };

  const formatWord = word => word.trim().replace(/ /g, "");

  const setImage = async image => {
    let leftContainer = document.querySelector(".left");
    let img = document.createElement("img");

    if (isPromise(image)) {
      let res = await image;
      img.src = res.default;
    } else {
      img.src = image;
    }

    leftContainer.innerHTML = "";
    leftContainer.append(img);
  };

  const getRoundData = round => {
    return gameState.roundData.find(data => data.round === round);
  };

  const setBackgroundColor = roundData => {
    let els = document.querySelectorAll(".accent-background");
    for (let i = 0; i < els.length; i++) {
      els[i].style.background = roundData.colorAccent;
    }

    let secondaryEls = document.querySelectorAll(".secondary-background");
    for (let i = 0; i < secondaryEls.length; i++) {
      secondaryEls[i].style.background = roundData.secondaryAccent;
    }
  };

  const setUpGame = ({ round, roundData }) => {
    let currentRoundData = getRoundData(round);
    let word = currentRoundData.word;
    let splitWord = word.split("");
    let currentWord = formatWord(word);

    setBackgroundColor(currentRoundData);

    let newState = setState({
      round,
      maxRounds: roundData.length,
      currentWord,
      currentRoundData,
      lettersLeft: currentWord.split(""),
      guessesRemaining: 12,
      lettersGuessed: []
    });

    let image = currentRoundData.image;
    setImage(image);

    document.querySelector(".letters-guessed").innerHTML =
      "No Missed Letters Yet";
    document.querySelector(".guesses-remaining").innerHTML =
      newState.guessesRemaining;

    generateWordHtml(splitWord);
  };

  const addGuessedLetter = letter => {
    if (gameState.lettersGuessed.indexOf(letter) === -1) {
      let newLettersGuessed = [...gameState.lettersGuessed, letter];

      setState({
        lettersGuessed: newLettersGuessed
      });

      document.querySelector(
        ".letters-guessed"
      ).innerText = newLettersGuessed.join(", ");

      removeGuessesTotal(gameState);
    } else {
      // alert("you already hit this letter!");
    }
  };

  const checkGameStatus = async gameState => {
    return await new Promise((resolve, reject) => {
      let winStatus = checkForWin(gameState);
      let lossStatus = checkForLoss(gameState);

      if (winStatus || lossStatus) {
        prepareNextRound(resolve, gameState);
      } else {
        resolve();
      }
    });
  };

  const prepareNextRound = (resolve, { round, maxRounds }) => {
    let nextRound = round + 1;
    if (nextRound <= maxRounds) {
      let newGameState = setState({
        round: nextRound
      });

      animateCardUp();

      setTimeout(() => {
        animateCard();
        setUpGame(newGameState);
        resolve();
      }, 900);
    } else {
      finishGame();
      resolve();
    }
  };

  const finishGame = () => {
    animateCardUp();
    setBackgroundColor({
      colorAccent: "#000"
    });

    document.querySelector(".inner-any").innerHTML = `
      <h2>Game Finished!</h2>
      <p>Final Wins: ${gameState.wins}</p>
      <p>Press any key to play again!</p>
    `;

    document.querySelector(".any").classList.remove("hide");

    resetCard();

    setState(initialState);
    setUpGame(initialState);
  };

  const animateCardUp = () => {
    let totalWrap = document.querySelector(".total-wrap");
    totalWrap.classList.add("move-up");
  };

  const animateCard = () => {
    let totalWrap = document.querySelector(".total-wrap");
    resetCard();
    totalWrap.classList.add("show");
  };

  const resetCard = () => {
    let totalWrap = document.querySelector(".total-wrap");
    totalWrap.classList.remove("move-up");
    totalWrap.classList.remove("show");
  };

  const checkForLoss = ({ guessesRemaining }) => {
    let lossStatus = guessesRemaining === 0;

    if (lossStatus) {
      playAudio(losing);
    }

    return lossStatus;
  };

  const checkForWin = ({ lettersLeft, wins, currentRoundData }) => {
    let winStatus = lettersLeft.length === 0;

    if (winStatus) {
      let winTotal = wins + 1;
      setState({
        wins: winTotal
      });

      if (currentRoundData.audio) {
        playAudio(currentRoundData.audio);
      }

      document.querySelector(".wins").innerText = winTotal;
    }

    return winStatus;
  };

  const playAudio = async audioFile => {
    let audio;

    if (gameState.currentSound) {
      gameState.currentSound.pause();
    }

    if (isPromise(audioFile)) {
      audio = await audioFile;
      audio = audio.default;
    } else {
      audio = audioFile;
    }

    let sound = new Audio(audio);
    sound.play();
    setState({
      currentSound: sound
    });
  };

  const removeGuessesTotal = ({ guessesRemaining }) => {
    let guessesRemainingTotal = guessesRemaining - 1;
    setState({
      guessesRemaining: guessesRemainingTotal
    });

    document.querySelector(
      ".guesses-remaining"
    ).innerText = guessesRemainingTotal;

    return guessesRemainingTotal;
  };

  const playGame = ({ currentWord }, keyCode) => {
    const letter = alphaBetKeyMappings[keyCode];

    if (!letter) return;

    const [wordIndex, isLetterFound] = findCorrectLetter(currentWord, letter);

    if (isLetterFound) {
      showLetters(letter);
      removeLetters(letter);
    } else {
      addGuessedLetter(letter);
    }
  };

  /**
   * This is what drives the game
   */
  const keyListener = () => {
    document.addEventListener("keydown", e => {
      const { hasStarted, processing } = gameState;

      if (!hasStarted) {
        let hideModal = document.querySelector(".any");
        hideModal.classList.add("hide");

        animateCard();

        setState({
          hasStarted: true
        });

        return;
      }

      /**
       * Stop fast key clicking from breaking game
       */
      if (processing) return;

      setState({
        processing: true
      });

      playGame(gameState, e.keyCode);
      checkGameStatus(gameState).then(() => {
        setState({
          processing: false
        });
      });
    });
  };

  const init = () => {
    setUpGame(gameState);
    keyListener();
  };

  return {
    init
  };
}

let game = new Game();
game.init();
