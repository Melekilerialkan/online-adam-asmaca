const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Kategori ve Kelime Havuzu
const wordCategories = {
    "Yiyecek": [
        "İSKENDER", "LAHMACUN", "MANTI", "KURU FASULYE", "KARNIYARIK", 
        "MENEMEN", "ÇİĞ KÖFTE", "BAKLAVA", "KÜNEFE", "SU BÖREĞİ", 
        "MERCİMEK ÇORBASI", "YAPRAK SARMA", "HÜNKARBEĞENDİ", "İÇLİ KÖFTE", "PİDE", 
        "KOKOREÇ", "KUMPİR", "TANTUNİ", "MİDYE DOLMA", "SÜTLAÇ"
    ],
    "İçecek": [
        "TÜRK KAHVESİ", "AYRAN", "ŞALGAM SUYU", "DEMLİ ÇAY", "BOZA", 
        "SAHLEP", "LİMONATA", "PORTAKAL SUYU", "MADEN SUYU", "GAZOZ", 
        "KEFİR", "ŞIRA", "SOĞUK ÇAY", "FİLTRE KAHVE", "SICAK ÇİKOLATA", 
        "KUŞBURNU", "IHLAMUR", "ADAÇAYI", "PAPATYA ÇAYI", "NAR SUYU"
    ],
    "Marka": [
        "LC WAIKIKI", "DEFACTO", "KOTON", "MAVİ", "BEYMEN", 
        "VAKKO", "İPEKYOL", "NETWORK", "SARAR", "KİĞILI", 
        "ALTINYILDIZ", "DAMAT", "SÜVARİ", "AVVA", "LUFIAN", 
        "COLINS", "LTB", "LES BENJAMINS", "TWIST", "YARGICI"
    ],
    "Hayvanlar": [
        "BUKALEMUN", "KÖPEKBALIĞI", "ŞEMPANZE", "PENGUEN", "KAPLAN", 
        "ZÜRAFA", "YUNUS", "KARTAL", "FLAMİNGO", "KANGURU", 
        "KOALA", "TİMSAH", "GERGEDAN", "SU AYGIRI", "ÇİTA", 
        "TEMBEL HAYVAN", "ORNİTORENK", "AKREP", "AHTAPOT", "DENİZANASI"
    ],
    "Teknoloji": [
        "BİLGİSAYAR", "YAPAY ZEKA", "ALGORİTMA", "VERİTABANI", "İŞLEMCİ", 
        "EKRAN KARTI", "ANAKART", "SİBER GÜVENLİK", "BULUT BİLİŞİM", "İŞLETİM SİSTEMİ", 
        "KLAVYE", "MONİTÖR", "YÖNLENDİRİCİ", "SUNUCU", "YAZILIM", 
        "DONANIM", "SANAL GERÇEKLİK", "BLOKZİNCİR", "AĞ GEÇİDİ", "GÜVENLİK DUVARI"
    ],
    "Şehirler": [
        "ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AMASYA", "ANKARA", "ANTALYA", "ARTVİN", "AYDIN", "BALIKESİR",
        "BİLECİK", "BİNGÖL", "BİTLİS", "BOLU", "BURDUR", "BURSA", "ÇANAKKALE", "ÇANKIRI", "ÇORUM", "DENİZLİ",
        "DİYARBAKIR", "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", "ESKİŞEHİR", "GAZİANTEP", "GİRESUN", "GÜMÜŞHANE", "HAKKARİ",
        "HATAY", "ISPARTA", "MERSİN", "İSTANBUL", "İZMİR", "KARS", "KASTAMONU", "KAYSERİ", "KIRKLARELİ", "KIRŞEHİR",
        "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA", "KAHRAMANMARAŞ", "MARDİN", "MUĞLA", "MUŞ", "NEVŞEHİR",
        "NİĞDE", "ORDU", "RİZE", "SAKARYA", "SAMSUN", "SİİRT", "SİNOP", "SİVAS", "TEKİRDAĞ", "TOKAT",
        "TRABZON", "TUNCELİ", "ŞANLIURFA", "UŞAK", "VAN", "YOZGAT", "ZONGULDAK", "AKSARAY", "BAYBURT", "KARAMAN",
        "KIRIKKALE", "BATMAN", "ŞIRNAK", "BARTIN", "ARDAHAN", "IĞDIR", "YALOVA", "KARABÜK", "KİLİS", "OSMANİYE", "DÜZCE"
    ]
};

// Tüm aktif odaları tutan obje
const rooms = {};

function createMask(word) {
    return word.split('').map(char => char === ' ' ? ' ' : '_');
}

io.on('connection', (socket) => {
    console.log(`Bağlantı: ${socket.id}`);

    // Odaya Katılma / Oda Kurma
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const code = roomCode.trim().toUpperCase();
        const name = (playerName || "Oyuncu").trim();

        if (!code) {
            socket.emit('roomError', 'Lütfen geçerli bir oda kodu girin!');
            return;
        }

        // Oda yoksa yeni oluştur
        if (!rooms[code]) {
            rooms[code] = {
                code: code,
                players: [],
                names: {},
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
                status: "waiting"
            };
        }

        const room = rooms[code];

        // Oda doluysa reddet
        if (room.players.length >= 2) {
            socket.emit('roomError', 'Bu oda şu an dolu kanki! Başka bir oda kodu dene.');
            return;
        }

        // Oyuncuyu odaya ekle
        socket.join(code);
        socket.roomCode = code;
        room.players.push(socket.id);
        room.names[socket.id] = name;
        room.scores[socket.id] = 0;

        if (room.players.length === 1) {
            socket.emit('waiting', {
                roomCode: code,
                message: `Oda kuruldu! Arkadaşına "${code}" kodunu gönder, bekleniyor...`
            });
        } else if (room.players.length === 2) {
            room.status = 'menu';
            io.to(code).emit('showMenu', {
                roomCode: code,
                message: 'İki oyuncu da odada! Bir oyun modu veya kategori seçin.'
            });
        }
    });

    // Kategoriden Rastgele Ortak Kelime Başlatma
    socket.on('startCategoryMode', (categoryName) => {
        const room = rooms[socket.roomCode];
        if (!room || room.status !== 'menu') return;

        const words = wordCategories[categoryName];
        if (!words) return;

        const randomWord = words[Math.floor(Math.random() * words.length)].trim().toLocaleUpperCase('tr-TR');
        startSharedGame(room, randomWord, categoryName);
    });

    // Kendi Kelimeni ve Kategorini Yazma Modu
    socket.on('initCustomMode', () => {
        const room = rooms[socket.roomCode];
        if (!room || room.status !== 'menu') return;

        room.status = 'setting_custom';
        const setterId = room.players[room.wordSetterIndex];
        const guesserId = room.players.find(id => id !== setterId);

        io.to(setterId).emit('showCustomInput', 'Sıra sende! Rakibine soracağın kelimeyi ve kategoriyi yaz.');
        io.to(guesserId).emit('waiting', {
            roomCode: room.code,
            message: `${room.names[setterId]} şu an senin için gizli bir kelime hazırlıyor...`
        });
    });

    socket.on('setCustomWord', (data) => {
        const room = rooms[socket.roomCode];
        if (!room || room.status !== 'setting_custom') return;

        const cleanWord = data.word.trim().toLocaleUpperCase('tr-TR');
        const cleanCat = data.category.trim() || "Özel Kategori";
        if (cleanWord.length < 2) return;

        room.wordSetterIndex = (room.wordSetterIndex + 1) % 2;
        startSharedGame(room, cleanWord, `${cleanCat} (Özel)`);
    });

    // Harf Tahmini
    socket.on('guessLetter', (letter) => {
        const room = rooms[socket.roomCode];
        if (!room || room.status !== 'playing' || room.currentTurn !== socket.id) return;

        const upperLetter = letter.toLocaleUpperCase('tr-TR');
        if (room.guessedLetters.includes(upperLetter)) return;

        room.guessedLetters.push(upperLetter);
        const opponentId = room.players.find(id => id !== socket.id);

        if (room.secretWord.includes(upperLetter)) {
            room.correctLetters.push(upperLetter);
            for (let i = 0; i < room.secretWord.length; i++) {
                if (room.secretWord[i] === upperLetter) {
                    room.maskedWord[i] = upperLetter;
                }
            }

            if (!room.maskedWord.includes('_')) {
                endGame(room, socket.id, `🎉 Son harfi açarak kelimeyi tamamladın ve kazandın!`, `😢 ${room.names[socket.id]} son harfi açarak kelimeyi buldu!`);
                return;
            }
        } else {
            room.wrongLetters.push(upperLetter);
            room.lives[socket.id]--;

            if (room.lives[socket.id] <= 0 && room.lives[opponentId] <= 0) {
                endGame(room, null, `💀 İkinizin de adamı asıldı! Kimse kazanamadı.`, `💀 İkinizin de adamı asıldı! Kimse kazanamadı.`);
                return;
            } else if (room.lives[socket.id] <= 0) {
                endGame(room, opponentId, `🏆 Rakibinin adamı asıldı, sen kazandın!`, `💀 Adamın tamamen asıldı, oyunu kaybettin!`);
                return;
            }
        }

        // Her hamlede sıra rakibe geçer
        if (room.lives[opponentId] > 0) {
            room.currentTurn = opponentId;
        }
        broadcastState(room);
    });

    // Direkt Kelime Tahmini
    socket.on('guessFullWord', (guessedWord) => {
        const room = rooms[socket.roomCode];
        if (!room || room.status !== 'playing' || room.currentTurn !== socket.id) return;

        const cleanGuess = guessedWord.trim().toLocaleUpperCase('tr-TR');
        const opponentId = room.players.find(id => id !== socket.id);

        if (cleanGuess === room.secretWord) {
            room.maskedWord = room.secretWord.split('');
            endGame(room, socket.id, `🎯 EFSANE! Kelimeyi tek seferde doğru tahmin ettin ve kazandın!`, `😱 ${room.names[socket.id]} kelimeyi direkt tahmin ederek kazandı!`);
        } else {
            room.lives[socket.id]--;
            if (room.lives[socket.id] <= 0) {
                endGame(room, opponentId, `🏆 Rakibin yanlış kelime tahminiyle asıldı, kazandın!`, `💀 Yanlış kelime tahmini! Son hakkın da gitti ve asıldın.`);
                return;
            }
            room.currentTurn = opponentId;
            broadcastState(room, `"${cleanGuess}" yanlış tahmin! Sıra geçti.`);
        }
    });

    socket.on('returnToMenu', () => {
        const room = rooms[socket.roomCode];
        if (room && room.players.length === 2) {
            room.status = 'menu';
            io.to(room.code).emit('showMenu', {
                roomCode: room.code,
                message: 'Yeni tur için bir mod veya kategori seçin!'
            });
        }
    });

    socket.on('disconnect', () => {
        const code = socket.roomCode;
        if (!code || !rooms[code]) return;

        const room = rooms[code];
        room.players = room.players.filter(id => id !== socket.id);
        delete room.names[socket.id];
        delete room.scores[socket.id];

        if (room.players.length === 0) {
            delete rooms[code]; // Oda tamamen boşaldıysa sil
        } else {
            room.status = 'waiting';
            io.to(code).emit('waiting', {
                roomCode: code,
                message: `Rakip oyundan ayrıldı. "${code}" odasında yeni rakip bekleniyor...`
            });
        }
    });
});

function startSharedGame(room, word, category) {
    room.secretWord = word;
    room.category = category;
    room.maskedWord = createMask(word);
    room.guessedLetters = [];
    room.correctLetters = [];
    room.wrongLetters = [];
    room.lives[room.players[0]] = 6;
    room.lives[room.players[1]] = 6;
    room.currentTurn = room.players[Math.floor(Math.random() * 2)];
    room.status = 'playing';

    broadcastState(room);
}

function broadcastState(room, extraNote = "") {
    room.players.forEach(playerId => {
        const opponentId = room.players.find(id => id !== playerId);
        const isMyTurn = (room.currentTurn === playerId);

        let msg = isMyTurn ? "🟢 SIRA SENDE! Bir harf seç veya kelimeyi tahmin et." : `⏳ ${room.names[opponentId]} düşünüyor, sıranı bekle...`;
        if (extraNote) msg = `${extraNote} | ${msg}`;

        io.to(playerId).emit('updateGame', {
            roomCode: room.code,
            category: room.category,
            maskedWord: room.maskedWord,
            correctLetters: room.correctLetters,
            wrongLetters: room.wrongLetters,
            myName: room.names[playerId],
            oppName: room.names[opponentId],
            myLives: room.lives[playerId],
            opponentLives: room.lives[opponentId],
            myScore: room.scores[playerId],
            opponentScore: room.scores[opponentId],
            isMyTurn: isMyTurn,
            turnMessage: msg
        });
    });
}

function endGame(room, winnerId, winnerMsg, loserMsg) {
    room.status = 'game_over';
    if (winnerId) {
        room.scores[winnerId]++;
    }

    room.players.forEach(playerId => {
        const opponentId = room.players.find(id => id !== playerId);
        const isWinner = (playerId === winnerId);

        // Son durumu da gönderelim ki asılan adam tam çizilsin
        io.to(playerId).emit('gameOver', {
            message: winnerId ? (isWinner ? winnerMsg : loserMsg) : winnerMsg,
            secretWord: room.secretWord,
            myLives: room.lives[playerId],
            opponentLives: room.lives[opponentId],
            myScore: room.scores[playerId],
            opponentScore: room.scores[opponentId]
        });
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Adam Asmaca Sunucusu ${PORT} portunda hazır kanki!`);
});
