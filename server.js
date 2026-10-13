const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// Kategori ve Kelime Havuzu (Markalar sadece Giyim Markası yapıldı)
const wordCategories = {
  Yiyecek: [
    "İSKENDER",
    "LAHMACUN",
    "MANTI",
    "KURU FASULYE",
    "KARNIYARIK",
    "MENEMEN",
    "ÇİĞ KÖFTE",
    "BAKLAVA",
    "KÜNEFE",
    "SU BÖREĞİ",
    "MERCİMEK ÇORBASI",
    "YAPRAK SARMA",
    "HÜNKARBEĞENDİ",
    "İÇLİ KÖFTE",
    "PİDE",
    "KOKOREÇ",
    "KUMPİR",
    "TANTUNİ",
    "MİDYE DOLMA",
    "SÜTLAÇ",
  ],
  İçecek: [
    "TÜRK KAHVESİ",
    "AYRAN",
    "ŞALGAM SUYU",
    "DEMLİ ÇAY",
    "BOZA",
    "SAHLEP",
    "LİMONATA",
    "PORTAKAL SUYU",
    "MADEN SUYU",
    "GAZOZ",
    "KEFİR",
    "ŞIRA",
    "SOĞUK ÇAY",
    "FİLTRE KAHVE",
    "SICAK ÇİKOLATA",
    "KUŞBURNU",
    "IHLAMUR",
    "ADAÇAYI",
    "PAPATYA ÇAYI",
    "NAR SUYU",
  ],
  Marka: [
    "LC WAIKIKI",
    "DEFACTO",
    "KOTON",
    "MAVİ",
    "BEYMEN",
    "VAKKO",
    "İPEKYOL",
    "NETWORK",
    "SARAR",
    "KİĞILI",
    "ALTINYILDIZ",
    "DAMAT",
    "SÜVARİ",
    "AVVA",
    "LUFIAN",
    "COLINS",
    "LTB",
    "LES BENJAMINS",
    " TWIST",
    "YARGICI",
  ],
  Hayvanlar: [
    "BUKALEMUN",
    "KÖPEKBALIĞI",
    "ŞEMPANZE",
    "PENGUEN",
    "KAPLAN",
    "ZÜRAFA",
    "YUNUS",
    "KARTAL",
    "FLAMİNGO",
    "KANGURU",
    "KOALA",
    "TİMSAH",
    "GERGEDAN",
    "SU AYGIRI",
    "ÇİTA",
    "TEMBEL HAYVAN",
    "ORNİTORENK",
    "AKREP",
    "AHTAPOT",
    "DENİZANASI",
  ],
  Teknoloji: [
    "BİLGİSAYAR",
    "YAPAY ZEKA",
    "ALGORİTMA",
    "VERİTABANI",
    "İŞLEMCİ",
    "EKRAN KARTI",
    "ANAKART",
    "SİBER GÜVENLİK",
    "BULUT BİLİŞİM",
    "İŞLETİM SİSTEMİ",
    "KLAVYE",
    "MONİTÖR",
    "YÖNLENDİRİCİ",
    "SUNUCU",
    "YAZILIM",
    "DONANIM",
    "SANAL GERÇEKLİK",
    "BLOKZİNCİR",
    "AĞ GEÇİDİ",
    "GÜVENLİK DUVARI",
  ],
  Şehirler: [
    "ADANA",
    "ADIYAMAN",
    "AFYONKARAHİSAR",
    "AĞRI",
    "AMASYA",
    "ANKARA",
    "ANTALYA",
    "ARTVİN",
    "AYDIN",
    "BALIKESİR",
    "BİLECİK",
    "BİNGÖL",
    "BİTLİS",
    "BOLU",
    "BURDUR",
    "BURSA",
    "ÇANAKKALE",
    "ÇANKIRI",
    "ÇORUM",
    "DENİZLİ",
    "DİYARBAKIR",
    "EDİRNE",
    "ELAZIĞ",
    "ERZİNCAN",
    "ERZURUM",
    "ESKİŞEHİR",
    "GAZİANTEP",
    "GİRESUN",
    "GÜMÜŞHANE",
    "HAKKARİ",
    "HATAY",
    "ISPARTA",
    "MERSİN",
    "İSTANBUL",
    "İZMİR",
    "KARS",
    "KASTAMONU",
    "KAYSERİ",
    "KIRKLARELİ",
    "KIRŞEHİR",
    "KOCAELİ",
    "KONYA",
    "KÜTAHYA",
    "MALATYA",
    "MANİSA",
    "KAHRAMANMARAŞ",
    "MARDİN",
    "MUĞLA",
    "MUŞ",
    "NEVŞEHİR",
    "NİĞDE",
    "ORDU",
    "RİZE",
    "SAKARYA",
    "SAMSUN",
    "SİİRT",
    "SİNOP",
    "SİVAS",
    "TEKİRDAĞ",
    "TOKAT",
    "TRABZON",
    "TUNCELİ",
    "ŞANLIURFA",
    "UŞAK",
    "VAN",
    "YOZGAT",
    "ZONGULDAK",
    "AKSARAY",
    "BAYBURT",
    "KARAMAN",
    "KIRIKKALE",
    "BATMAN",
    "ŞIRNAK",
    "BARTIN",
    "ARDAHAN",
    "IĞDIR",
    "YALOVA",
    "KARABÜK",
    "KİLİS",
    "OSMANİYE",
    "DÜZCE",
  ],
};

let room = {
  players: [],
  scores: {},
  secretWord: "",
  category: "",
  maskedWord: [],
  guessedLetters: [],
  correctLetters: [],
  wrongLetters: [],
  lives: {},
  currentTurn: null,
  wordSetterIndex: 0,
  status: "waiting",
};

function createMask(word) {
  return word.split("").map((char) => (char === " " ? " " : "_"));
}

io.on("connection", (socket) => {
  console.log(`Oyuncu bağlandı: ${socket.id}`);

  if (room.players.length < 2) {
    room.players.push(socket.id);
    room.scores[socket.id] = 0;

    if (room.players.length === 1) {
      socket.emit(
        "waiting",
        "1. Oyuncusun. Rakibinin bağlanması bekleniyor...",
      );
    } else {
      room.status = "menu";
      io.emit("showMenu", {
        scores: getScoresArray(),
        message: "İki oyuncu da hazır! Bir oyun modu seçin.",
      });
    }
  } else {
    socket.emit("roomFull", "Oda şu an dolu kanki!");
    socket.disconnect();
    return;
  }

  // Kategoriden Rastgele Ortak Kelime Başlatma
  socket.on("startCategoryMode", (categoryName) => {
    if (room.status !== "menu") return;
    const words = wordCategories[categoryName];
    if (!words) return;

    const randomWord = words[Math.floor(Math.random() * words.length)]
      .trim()
      .toLocaleUpperCase("tr-TR");
    startSharedGame(randomWord, categoryName);
  });

  // Kendi Kelimeni ve Kategorini Yazma Moduna Geçiş
  socket.on("initCustomMode", () => {
    if (room.status !== "menu") return;
    room.status = "setting_custom";

    const setterId = room.players[room.wordSetterIndex];
    const guesserId = room.players.find((id) => id !== setterId);

    io.to(setterId).emit(
      "showCustomInput",
      "Sıra sende! Rakibine soracağın kelimeyi ve kategoriyi yaz.",
    );
    io.to(guesserId).emit(
      "waiting",
      "Rakibin şu an senin için gizli bir kelime ve kategori hazırlıyor...",
    );
  });

  // Özel Kelime Gönderildiğinde
  socket.on("setCustomWord", (data) => {
    if (room.status !== "setting_custom") return;
    const cleanWord = data.word.trim().toLocaleUpperCase("tr-TR");
    const cleanCat = data.category.trim() || "Özel Kategori";

    if (cleanWord.length < 2) return;

    room.wordSetterIndex = (room.wordSetterIndex + 1) % 2;
    startSharedGame(cleanWord, `${cleanCat} (Özel)`);
  });

  // Harf Tahmini (Her tahminde sıra diğerine geçer)
  socket.on("guessLetter", (letter) => {
    if (room.status !== "playing" || room.currentTurn !== socket.id) return;

    const upperLetter = letter.toLocaleUpperCase("tr-TR");
    if (room.guessedLetters.includes(upperLetter)) return;

    room.guessedLetters.push(upperLetter);
    const opponentId = room.players.find((id) => id !== socket.id);

    if (room.secretWord.includes(upperLetter)) {
      room.correctLetters.push(upperLetter);
      for (let i = 0; i < room.secretWord.length; i++) {
        if (room.secretWord[i] === upperLetter) {
          room.maskedWord[i] = upperLetter;
        }
      }

      if (!room.maskedWord.includes("_")) {
        endGame(
          socket.id,
          `🎉 Son harfi açarak kelimeyi tamamladın ve kazandın!`,
          `😢 Rakibin son harfi açarak kelimeyi buldu!`,
        );
        return;
      }
    } else {
      room.wrongLetters.push(upperLetter);
      room.lives[socket.id]--;

      if (room.lives[socket.id] <= 0 && room.lives[opponentId] <= 0) {
        endGame(
          null,
          `💀 İkinizin de canı bitti! Kimse kazanamadı.`,
          `💀 İkinizin de canı bitti! Kimse kazanamadı.`,
        );
        return;
      } else if (room.lives[socket.id] <= 0) {
        endGame(
          opponentId,
          `🏆 Rakibinin tüm canları bitti, sen kazandın!`,
          `💀 Tüm canların bitti, oyunu kaybettin!`,
        );
        return;
      }
    }

    if (room.lives[opponentId] > 0) {
      room.currentTurn = opponentId;
    }
    broadcastState();
  });

  // Direkt Kelime Tahmini
  socket.on("guessFullWord", (guessedWord) => {
    if (room.status !== "playing" || room.currentTurn !== socket.id) return;

    const cleanGuess = guessedWord.trim().toLocaleUpperCase("tr-TR");
    const opponentId = room.players.find((id) => id !== socket.id);

    if (cleanGuess === room.secretWord) {
      room.maskedWord = room.secretWord.split("");
      endGame(
        socket.id,
        `🎯 EFSANE! Kelimeyi tek seferde doğru tahmin ettin ve kazandın!`,
        `😱 Rakibin kelimeyi direkt tahmin ederek oyunu kazandı!`,
      );
    } else {
      room.lives[socket.id]--;
      if (room.lives[socket.id] <= 0) {
        endGame(
          opponentId,
          `🏆 Rakibin yanlış kelime tahminiyle son canını kaybetti, kazandın!`,
          `💀 Yanlış kelime tahmini! Son canın da gitti ve kaybettin.`,
        );
        return;
      }
      room.currentTurn = opponentId;
      broadcastState(`${cleanGuess} yanlış tahmin! Sıra geçti.`);
    }
  });

  socket.on("returnToMenu", () => {
    if (room.players.length === 2) {
      room.status = "menu";
      io.emit("showMenu", {
        scores: getScoresArray(),
        message: "Yeni tur için bir mod veya kategori seçin!",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Oyuncu ayrıldı: ${socket.id}`);
    room.players = room.players.filter((id) => id !== socket.id);
    delete room.scores[socket.id];
    room.status = "waiting";
    io.emit("waiting", "Rakip oyundan ayrıldı. Yeni rakip bekleniyor...");
  });
});

function startSharedGame(word, category) {
  room.secretWord = word;
  room.category = category;
  room.maskedWord = createMask(word);
  room.guessedLetters = [];
  room.correctLetters = [];
  room.wrongLetters = [];
  room.lives[room.players[0]] = 6;
  room.lives[room.players[1]] = 6;
  room.currentTurn = room.players[Math.floor(Math.random() * 2)];
  room.status = "playing";

  broadcastState();
}

function broadcastState(extraNote = "") {
  room.players.forEach((playerId) => {
    const opponentId = room.players.find((id) => id !== playerId);
    const isMyTurn = room.currentTurn === playerId;

    let msg = isMyTurn
      ? "🟢 SIRA SENDE! Bir harf seç veya kelimeyi tahmin et."
      : "⏳ Rakibin düşünüyor, sıranı bekle...";
    if (extraNote) msg = `${extraNote} | ${msg}`;

    io.to(playerId).emit("updateGame", {
      category: room.category,
      maskedWord: room.maskedWord,
      correctLetters: room.correctLetters,
      wrongLetters: room.wrongLetters,
      myLives: room.lives[playerId],
      opponentLives: room.lives[opponentId],
      myScore: room.scores[playerId],
      opponentScore: room.scores[opponentId],
      isMyTurn: isMyTurn,
      turnMessage: msg,
    });
  });
}

function endGame(winnerId, winnerMsg, loserMsg) {
  room.status = "game_over";
  if (winnerId) {
    room.scores[winnerId]++;
  }

  room.players.forEach((playerId) => {
    const isWinner = playerId === winnerId;
    io.to(playerId).emit("gameOver", {
      message: winnerId ? (isWinner ? winnerMsg : loserMsg) : winnerMsg,
      secretWord: room.secretWord,
      myScore: room.scores[playerId],
      opponentScore: room.scores[room.players.find((id) => id !== playerId)],
    });
  });
}

function getScoresArray() {
  return room.players.map(
    (id, index) => `Oyuncu ${index + 1}: ${room.scores[id] || 0}`,
  );
}

// Render.com için dinamik PORT ayarı
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Adam Asmaca Sunucusu ${PORT} portunda hazır kanki!`);
});
