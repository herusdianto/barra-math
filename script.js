const ROW_COUNT = 2;
const MIN = 10;
const MAX = 99;

const slotContainer = document.getElementById("slot-container");
const inputLine = document.getElementById("input-line");
const underline = document.getElementById("underline");
const timerEl = document.getElementById("timer");
const nextBtn = document.getElementById("next-btn");
const showStory1Btn = document.getElementById("show-story-1-btn");
const showStory2Btn = document.getElementById("show-story-2-btn");
const symbolEl = document.querySelector(".plus-symbol");

let totalAnswer = 0;
let answerDigits = [];
let timerId = null;

let questionCount = 0;
let history = [];
let currentQuestionData = null;

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomSubtrahend(min, max, minuend) {
  return getRandomNumber(min, Math.min(max, minuend));
}

function splitDigits(num) {
  return num.toString().split("").map(Number);
}

function createSlotDigit(finalNumber) {
  const slot = document.createElement("div");
  slot.className = "digit-slot";

  const inner = document.createElement("div");
  inner.className = "digit-inner";

  for (let i = 0; i < 5; i++) {
    const span = document.createElement("div");
    span.className = "digit-number";
    span.textContent = Math.floor(Math.random() * 10);
    inner.appendChild(span);
  }

  const final = document.createElement("div");
  final.className = "digit-number";
  final.textContent = finalNumber;
  inner.appendChild(final);

  slot.appendChild(inner);

  setTimeout(() => {
    const slotHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--digit-height"
      )
    );
    inner.style.transform = `translateY(-${slotHeight * 5}px)`;
  }, 50);

  return slot;
}

async function showSlotRow(digits, maxLength) {
  return new Promise((resolve) => {
    const line = document.createElement("div");
    line.className = "line";

    const pad = maxLength - digits.length;
    for (let i = 0; i < pad; i++) {
      const empty = document.createElement("div");
      empty.className = "digit-slot no-border";
      line.appendChild(empty);
    }

    digits.forEach((d) => {
      line.appendChild(createSlotDigit(d));
    });

    slotContainer.appendChild(line);
    setTimeout(resolve, 1000);
  });
}

async function showMathQuestions() {
  slotContainer.innerHTML = "";
  inputLine.innerHTML = "";
  inputLine.style.display = "none";
  nextBtn.style.display = "none";
  timerEl.style.display = "none";

  const isAddition = questionCount < 4;
  const operator = isAddition ? "+" : "-";
  symbolEl.textContent = operator;

  let numbers = [];
  const allDigits = [];
  let maxLen = 0;

  for (let i = 0; i < ROW_COUNT; i++) {
    let num;
    if (!isAddition && i === 1) {
      num = getRandomSubtrahend(MIN, MAX, numbers[0]);
    } else {
      num = getRandomNumber(MIN, MAX);
    }
    numbers.push(num);
    const digits = splitDigits(num);
    allDigits.push(digits);
    maxLen = Math.max(maxLen, digits.length);
  }

  const [a, b] = numbers;
  const result = isAddition ? a + b : a - b;

  totalAnswer = result;
  answerDigits = splitDigits(result);
  const totalLen = Math.max(answerDigits.length, maxLen);

  for (let digits of allDigits) {
    await showSlotRow(digits, totalLen);
  }

  underline.style.minWidth = `${totalLen * 58}px`;

  currentQuestionData = { a, b, operator, answer: result, time: null };

  showInputs(answerDigits, totalLen);
}

function showInputs(digits, targetLength) {
  inputLine.innerHTML = "";
  inputLine.style.display = "flex";

  const pad = targetLength - digits.length;
  const inputs = [];

  for (let i = 0; i < pad; i++) {
    const empty = document.createElement("div");
    empty.className = "digit-slot no-border";
    inputLine.appendChild(empty);
  }

  digits.forEach((_, i) => {
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = 9;
    input.inputMode = "numeric";
    inputLine.appendChild(input);
    inputs.push(input);
  });

  const lastIndex = inputs.length - 1;
  inputs[lastIndex].focus();

  for (let i = lastIndex; i >= 0; i--) {
    inputs[i].addEventListener("input", function () {
      const val = this.value;
      if (val === digits[i].toString()) {
        this.style.borderColor = "#0f0";

        const allCorrect = inputs.every(
          (input, idx) => input.value === digits[idx].toString()
        );
        if (allCorrect) {
          stopTimer();

          const finishTime = timerEl.textContent;
          currentQuestionData.time = finishTime;
          history.push(currentQuestionData);
          localStorage.setItem("mathHistory", JSON.stringify(history));

          nextBtn.style.display = "inline-block";
          nextBtn.focus();
          inputs.forEach((input) => (input.disabled = true));
        } else {
          if (i === lastIndex) {
            inputs[0].focus();
          } else {
            inputs[i + 1].focus();
          }
        }
      } else if (val.length > 0) {
        this.style.borderColor = "#f00";
        const input = this;
        setTimeout(() => {
          input.value = "";
          input.style.borderColor = "#00ffcc";
          input.focus();
        }, 500);
      }
    });
  }

  startTimer();
}

function startTimer() {
  timerEl.style.display = "block";
  const start = performance.now();

  function update() {
    const now = performance.now();
    const elapsed = now - start;
    const mins = String(Math.floor(elapsed / 60000)).padStart(2, "0");
    const secs = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
    const ms = String(Math.floor(elapsed % 1000)).padStart(3, "0");
    timerEl.textContent = `${mins}:${secs}:${ms}`;
    timerId = requestAnimationFrame(update);
  }

  timerId = requestAnimationFrame(update);
}

function stopTimer() {
  if (timerId !== null) {
    cancelAnimationFrame(timerId);
    timerId = null;
  }
}

function showHistoryPage() {
  if (history.length === 0) {
    // Kalau kosong langsung tampil halaman soal awal
    showMathQuestions();
    return;
  }

  // kalau ada riwayat, tampilkan halaman riwayat
  slotContainer.innerHTML = "";
  inputLine.style.display = "none";
  nextBtn.style.display = "none";
  timerEl.style.display = "none";
  underline.style.minWidth = "auto";
  symbolEl.textContent = "";

  const historyTitle = document.createElement("h2");
  historyTitle.textContent = "Riwayat Latihan";
  historyTitle.style.color = "#00ffcc";
  historyTitle.style.textAlign = "center";
  historyTitle.style.marginBottom = "20px";
  slotContainer.appendChild(historyTitle);

  const container = document.createElement("div");
  container.className = "history-container";

  // Garis timeline vertikal
  const timelineLine = document.createElement("div");
  timelineLine.className = "timeline-line";
  container.appendChild(timelineLine);

  history.forEach((q, idx) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.style.animationDelay = `${idx * 0.1}s`;

    const questionText = document.createElement("div");
    questionText.textContent = `${q.a} ${q.operator} ${q.b} = ${q.answer}`;
    card.appendChild(questionText);

    const timeText = document.createElement("span");
    timeText.className = "history-time";
    timeText.textContent = `Waktu: ${q.time}`;
    card.appendChild(timeText);

    const dot = document.createElement("div");
    dot.className = "timeline-dot";
    dot.style.top = `calc(${idx * (card.offsetHeight + 20) + 24}px)`;

    container.appendChild(card);
    container.appendChild(dot);
  });

  slotContainer.appendChild(container);

  const buttonsContainer = document.createElement("div");
  buttonsContainer.id = "buttons-container";

  const restartBtn = document.createElement("button");
  restartBtn.id = "restart-btn";
  restartBtn.textContent = "Mulai Lagi";

  restartBtn.addEventListener("click", () => {
    questionCount = 0;
    showMathQuestions();
  });

  const clearHistoryBtn = document.createElement("button");
  clearHistoryBtn.id = "clear-history-btn";
  clearHistoryBtn.textContent = "Hapus Riwayat";

  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Yakin ingin menghapus semua riwayat?")) {
      history = [];
      questionCount = 0;
      localStorage.removeItem("mathHistory");
      showMathQuestions(); // setelah hapus riwayat langsung ke halaman soal awal
    }
  });

  buttonsContainer.appendChild(restartBtn);
  buttonsContainer.appendChild(clearHistoryBtn);

  slotContainer.appendChild(buttonsContainer);
}

const nama = [
  "Aep",
  "Ajat",
  "Cece",
  "Cecep",
  "Cucu",
  "Dadang",
  "Dayat",
  "Deden",
  "Enjang",
  "Jajang",
  "Juminem",
  "Junaedi",
  "Kartinah",
  "Kartoyo",
  "Katminah",
  "Katminih",
  "Mulyono",
  "Neneng",
  "Oded",
  "Parjo",
  "Poniman",
  "Sarimin",
  "Sarkem",
  "Sugeng",
  "Sugiono",
  "Sukamto",
  "Subagio",
  "Suroto",
  "Sutikno",
  "Sutrisno",
  "Tugimin",
  "Tukiyem",
  "Tukino",
  "Tuminah",
  "Tumirah",
  "Tuminih",
  "Udin",
  "Wagimin",
];

const benda = [
  "kelereng",
  "hewan kelinci",
  "hewan kucing",
  "hewan anjing",
  "hewan harimau",
  "hewan singa",
  "hewan katak",
  "buah apel",
  "buah jeruk",
  "buah pir",
  "buah anggur",
  "bola",
  "buah pisang",
  "buah semangka",
  "sayur sawi",
  "sayur brokoli",
  "buah paprika",
  "buah mangga",
];

let storyStep = 0; // untuk mengatur soal cerita 1 dan 2

function createEmptyDigitInputs() {
  const input = document.createElement("input");
  input.type = "number";
  input.min = 0;
  input.max = 9;
  input.style.width = "40px";
  input.style.height = "60px";
  input.style.fontSize = "32px";
  input.style.textAlign = "center";
  input.style.background = "transparent";
  input.style.border = "none";
  input.style.borderRadius = "0px";
  input.style.color = "#fff";
  input.inputMode = "numeric";
  input.disabled = true;
  return input;
}

function createDigitInputs(number) {
  return splitDigits(number).map(() => {
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = 9;
    input.style.width = "40px";
    input.style.height = "60px";
    input.style.fontSize = "32px";
    input.style.textAlign = "center";
    input.style.background = "#222";
    input.style.border = "2px solid #00ffcc";
    input.style.borderRadius = "6px";
    input.style.color = "#fff";
    input.inputMode = "numeric";
    return input;
  });
}

async function showStoryQuestion2(bendaPilihan) {
  storyStep = 1;
  const { nama, benda, jumlah, answers } = currentQuestionData;

  const secondQuestionContainer = document.createElement("div");
  secondQuestionContainer.style.marginTop = "32px";
  slotContainer.appendChild(secondQuestionContainer);

  const p1 = document.createElement("p");
  p1.style.fontSize = "20px";
  p1.style.marginBottom = "8px";
  p1.textContent = `Berapa jumlah ${bendaPilihan} seluruhnya?`;
  secondQuestionContainer.appendChild(p1);

  const angka_1 = answers[0]; // hasil penjumlahan pertama
  const angka_2 = jumlah[2]; // angka baru untuk ditambah
  const jawaban = answers[1]; // hasil akhir

  const inputWrapper = document.createElement("div");
  inputWrapper.style.display = "flex";
  inputWrapper.style.flexDirection = "column";
  inputWrapper.style.alignItems = "center";
  inputWrapper.style.gap = "6px";
  inputWrapper.style.marginTop = "32px"; // spacing antar soal

  let digitsAngka1 = splitDigits(angka_1);
  let digitsAngka2 = splitDigits(angka_2);
  let digitsAnswer = splitDigits(jawaban);

  let prependAngka1 = (digitsAnswer.length > digitsAngka1.length);
  let prependAngka2 = (digitsAnswer.length > digitsAngka2.length);

  // Baris angka pertama
  const row1 = document.createElement("div");
  row1.style.display = "flex";
  row1.style.justifyContent = "center";
  row1.style.gap = "8px";
  const num1Inputs = createDigitInputs(angka_1);
  if (prependAngka1) {
    row1.appendChild(createEmptyDigitInputs())
  }
  num1Inputs.forEach((i) => row1.appendChild(i));
  inputWrapper.appendChild(row1);

  // Baris angka kedua
  const row2 = document.createElement("div");
  row2.style.display = "flex";
  row2.style.justifyContent = "center";
  row2.style.gap = "8px";
  const num2Inputs = createDigitInputs(angka_2);
  if (prependAngka2) {
    row2.appendChild(createEmptyDigitInputs())
  }
  num2Inputs.forEach((i) => row2.appendChild(i));
  inputWrapper.appendChild(row2);

  // Baris garis + tanda +
  const lineRow = document.createElement("div");
  lineRow.style.display = "flex";
  lineRow.style.alignItems = "center";
  lineRow.style.gap = "8px";
  lineRow.style.width = "150px";

  const line = document.createElement("div");
  line.style.height = "3px";
  line.style.backgroundColor = "#00ffcc";
  line.style.flexGrow = "1";

  const plusSign = document.createElement("span");
  plusSign.textContent = "+";
  plusSign.style.fontSize = "28px";
  plusSign.style.color = "#00ffcc";
  plusSign.style.userSelect = "none";

  lineRow.appendChild(line);
  lineRow.appendChild(plusSign);
  inputWrapper.appendChild(lineRow);

  // Baris jawaban
  const row3 = document.createElement("div");
  row3.style.display = "flex";
  row3.style.justifyContent = "center";
  row3.style.gap = "8px";
  const answerInputs = createDigitInputs(angka_1 + angka_2);
  answerInputs.forEach((i) => row3.appendChild(i));
  inputWrapper.appendChild(row3);

  slotContainer.appendChild(inputWrapper);

  startTimer();

  function checkAllInputs() {
    const userNum1 = parseInt(
      num1Inputs.map((i) => i.value).join("")
    );
    if (isNaN(userNum1) || userNum1 !== angka_1) return false;

    const userNum2 = parseInt(
      num2Inputs.map((i) => i.value).join("")
    );
    if (isNaN(userNum2) || userNum2 !== angka_2) return false;

    const userAnswer = parseInt(
      answerInputs.map((i) => i.value).join("")
    );
    if (isNaN(userAnswer) || userAnswer !== angka_1 + angka_2)
      return false;

    return true;
  }

  let soalInputs = [...num1Inputs, ...num2Inputs];
  const allInputs = [
    ...num1Inputs,
    ...num2Inputs,
    ...answerInputs,
  ];
  allInputs.forEach((input, idx) => {
    if (idx > 0) input.disabled = true;

    input.addEventListener("input", function () {
      let expectedDigit;
      if (idx < num1Inputs.length) {
        expectedDigit = splitDigits(angka_1)[idx];
      } else if (idx < num1Inputs.length + num2Inputs.length) {
        expectedDigit =
          splitDigits(angka_2)[idx - num1Inputs.length];
      } else {
        expectedDigit = splitDigits(angka_1 + angka_2)[
          idx - num1Inputs.length - num2Inputs.length
        ];
      }

      if (this.value === expectedDigit.toString()) {
        this.style.borderColor = "#0f0";

        if (idx < allInputs.length - 2) {
          allInputs[idx].disabled = true;

          if (idx !== soalInputs.length - 1) {
            allInputs[idx + 1].disabled = false;
            allInputs[idx + 1].focus();
          } else {
            allInputs[allInputs.length - 1].disabled = false;
            allInputs[allInputs.length - 1].focus();
          }
        } else {
          let allInputsFilled = true;

          for (let i = 0; i < allInputs.length; i++) {
            const inp = allInputs[i];
            if (inp.value.length !== 1) {
              allInputsFilled = false;
              inp.disabled = false;
              allInputs[i].focus();
              break;
            }
          }

          if (allInputsFilled) {
            stopTimer();

            const finishTime = timerEl.textContent;
            let currentQuestionStoryData = { a: angka_1, b: angka_2, operator: "+", answer: jawaban, time: finishTime };
            history.push(currentQuestionStoryData);
            localStorage.setItem("mathHistory", JSON.stringify(history));

            showHistoryPage();
          }
        }
      } else if (this.value.length > 0) {
        this.style.borderColor = "#f00";
        setTimeout(() => {
          this.value = "";
          this.style.borderColor = "#00ffcc";
          this.focus();
        }, 400);
      }
    });
  });

  allInputs[0].focus();
}

async function showStoryQuestion1() {
  slotContainer.innerHTML = "";
  inputLine.innerHTML = "";
  inputLine.style.display = "flex";
  nextBtn.style.display = "none";
  timerEl.style.display = "none";
  underline.style.minWidth = "auto";
  symbolEl.textContent = "";

  // Pilih nama dan benda acak tanpa duplikasi nama
  const namaPilihan = [];
  while (namaPilihan.length < 3) {
    const n = nama[Math.floor(Math.random() * nama.length)];
    if (!namaPilihan.includes(n)) namaPilihan.push(n);
  }
  const bendaPilihan = benda[Math.floor(Math.random() * benda.length)];
  const angka_1 = getRandomNumber(10, 99);
  const angka_2 = getRandomNumber(10, 99);
  const angka_3 = getRandomNumber(10, 99);

  // Simpan data untuk soal kedua nanti
  currentQuestionData = {
    type: "story",
    nama: namaPilihan,
    benda: bendaPilihan,
    jumlah: [angka_1, angka_2, angka_3],
    answers: [angka_1 + angka_2, angka_1 + angka_2 + angka_3],
    time: null,
  };

  // Tampilkan soal 1
  const p1 = document.createElement("p");
  p1.style.fontSize = "20px";
  p1.style.marginBottom = "8px";
  p1.textContent = `${namaPilihan[0]} mempunyai ${bendaPilihan} sebanyak ${angka_1}, ${namaPilihan[1]} mempunyai ${bendaPilihan} sebanyak ${angka_2}, sedangkan ${namaPilihan[2]} mempunyai ${bendaPilihan} sebanyak ${angka_3}.`;
  slotContainer.appendChild(p1);

  showStory1Btn.style.display = "inline-block";
  showStory1Btn.focus();

  showStory1Btn.addEventListener("click", () => {
    showStory1Btn.remove();

    const p2 = document.createElement("p");
    p2.style.fontSize = "20px";
    p2.style.marginBottom = "12px";
    p2.textContent = `Berapa jumlah ${bendaPilihan} milik ${namaPilihan[0]} dan ${namaPilihan[1]}?`;
    slotContainer.appendChild(p2);

    const jawaban = currentQuestionData.answers[0]; 
  
    let digitsAngka1 = splitDigits(angka_1);
    let digitsAngka2 = splitDigits(angka_2);
    let digitsAnswer = splitDigits(jawaban);

    let prependAngka1 = (digitsAnswer.length > digitsAngka1.length);
    let prependAngka2 = (digitsAnswer.length > digitsAngka2.length);

    const inputWrapper = document.createElement("div");
    inputWrapper.style.display = "flex";
    inputWrapper.style.flexDirection = "column";
    inputWrapper.style.alignItems = "center"; // rata tengah horizontal
    inputWrapper.style.gap = "6px";
    inputWrapper.style.marginTop = "12px";

    // Baris angka pertama
    const row1 = document.createElement("div");
    row1.style.display = "flex";
    row1.style.justifyContent = "center";
    row1.style.gap = "8px";
    const num1Inputs = createDigitInputs(angka_1);
    if (prependAngka1) {
      row1.appendChild(createEmptyDigitInputs())
    }
    num1Inputs.forEach((i) => row1.appendChild(i));
    inputWrapper.appendChild(row1);

    // Baris angka kedua
    const row2 = document.createElement("div");
    row2.style.display = "flex";
    row2.style.justifyContent = "center";
    row2.style.gap = "8px";
    const num2Inputs = createDigitInputs(angka_2);
    if (prependAngka2) {
      row2.appendChild(createEmptyDigitInputs())
    }
    num2Inputs.forEach((i) => row2.appendChild(i));
    inputWrapper.appendChild(row2);

    // Baris garis + tanda plus di samping kanan garis
    const lineRow = document.createElement("div");
    lineRow.style.display = "flex";
    lineRow.style.alignItems = "center";
    lineRow.style.gap = "8px";
    lineRow.style.width = "150px"; // bisa disesuaikan

    const line = document.createElement("div");
    line.style.height = "3px";
    line.style.backgroundColor = "#00ffcc";
    line.style.flexGrow = "1";

    const plusSign = document.createElement("span");
    plusSign.textContent = "+";
    plusSign.style.fontSize = "28px";
    plusSign.style.color = "#00ffcc";
    plusSign.style.userSelect = "none";

    lineRow.appendChild(line);
    lineRow.appendChild(plusSign);
    inputWrapper.appendChild(lineRow);

    // Baris jawaban (tanpa tanda sama dengan)
    const row3 = document.createElement("div");
    row3.style.display = "flex";
    row3.style.justifyContent = "center";
    row3.style.gap = "8px";
    const answerInputs = createDigitInputs(angka_1 + angka_2);
    answerInputs.forEach((i) => row3.appendChild(i));
    inputWrapper.appendChild(row3);

    slotContainer.appendChild(inputWrapper);

    startTimer();

    // Validasi input (sama seperti sebelumnya)
    function checkAllInputs() {
      const userNum1 = parseInt(num1Inputs.map((i) => i.value).join(""));
      if (isNaN(userNum1) || userNum1 !== angka_1) return false;

      const userNum2 = parseInt(num2Inputs.map((i) => i.value).join(""));
      if (isNaN(userNum2) || userNum2 !== angka_2) return false;

      const userAnswer = parseInt(answerInputs.map((i) => i.value).join(""));
      if (isNaN(userAnswer) || userAnswer !== angka_1 + angka_2) return false;

      return true;
    }

    let soalInputs = [...num1Inputs, ...num2Inputs];
    const allInputs = [...num1Inputs, ...num2Inputs, ...answerInputs];
    allInputs.forEach((input, idx) => {
      if (idx > 0) input.disabled = true;

      input.addEventListener("input", function () {
        let expectedDigit;
        if (idx < num1Inputs.length) {
          expectedDigit = splitDigits(angka_1)[idx];
        } else if (idx < num1Inputs.length + num2Inputs.length) {
          expectedDigit = splitDigits(angka_2)[idx - num1Inputs.length];
        } else {
          expectedDigit = splitDigits(angka_1 + angka_2)[
            idx - num1Inputs.length - num2Inputs.length
          ];
        }

        if (this.value === expectedDigit.toString()) {
          this.style.borderColor = "#0f0";

          if (idx < allInputs.length - 2) {
            allInputs[idx].disabled = true;

            // bukan input soal terakhir
            if (idx !== soalInputs.length - 1) {
              allInputs[idx + 1].disabled = false;
              allInputs[idx + 1].focus();
            } else {
              allInputs[allInputs.length - 1].disabled = false;
              allInputs[allInputs.length - 1].focus();
            }
          } else {
            let allInputsFilled = true;

            for (let index = 0; index < allInputs.length; index++) {
              let inp = allInputs[index];
              if (inp.value.length !== 1) {
                allInputsFilled = false;
                inp.disabled = false;
                allInputs[index].focus();
                break;
              }
            }

            if (allInputsFilled) {
              stopTimer();

              const finishTime = timerEl.textContent;
              let currentQuestionStoryData = { a: angka_1, b: angka_2, operator: "+", answer: jawaban, time: finishTime };
              history.push(currentQuestionStoryData);
              localStorage.setItem("mathHistory", JSON.stringify(history));

              showStory2Btn.style.display = "inline-block";
              showStory2Btn.focus();

              showStory2Btn.addEventListener("click", () => {
                showStory2Btn.remove();

                showStoryQuestion2(bendaPilihan);
              });
            }
          }
        } else if (this.value.length > 0) {
          this.style.borderColor = "#f00";
          setTimeout(() => {
            this.value = "";
            this.style.borderColor = "#00ffcc";
            this.focus();
          }, 400);
        }
      });
    });

    num1Inputs[0].focus();
  });
}

// modifikasi nextBtn event
nextBtn.addEventListener("click", () => {
  questionCount++;
  if (questionCount < 4) {
    // 4 soal penjumlahan
    showMathQuestions();
  } else if (questionCount < 8) {
    // 4 soal pengurangan
    showMathQuestions();
  } else if (questionCount === 8) {
    // mulai soal cerita 1
    showStoryQuestion1();
    questionCount++;
    storyStep = 0;
    nextBtn.style.display = "none"; // sembunyi dulu sampai jawab benar
  } else if (questionCount === 9) {
    // soal cerita 2
    showStoryQuestion1();
    questionCount++;
    storyStep = 1;
    nextBtn.style.display = "none";
  } else {
    // selesai semua, lanjut ke riwayat
    nextBtn.style.display = "none";
    showHistoryPage();
  }
});

// showMathQuestions();
showStoryQuestion1();
