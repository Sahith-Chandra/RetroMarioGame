// Ensure all necessary imports
const { Client, Account, Databases, ID, Query } = Appwrite; // comes from Appwrite
const projectId = '66529d920035d8178ceb';
const databaseId = '6652d842000b486547e0';
const collectionId = '6652d8560022e8120d67';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(projectId);

const account = new Account(client);
const database = new Databases(client);

async function isLoggedIn() {
    return account.get().then(response => {
        return !!response;
    }).catch(error => console.error(error));
}

async function getUserId() {
    return account.get().then(response => {
        return response.$id;
    }).catch(error => console.error(error));
}

function displayUsername() {
    account.get().then(response => {
        const usernameElement = document.getElementById('username');
        usernameElement.textContent = response.name;
    }).catch(error => console.error(error));
}

function updateScore(score) {
    const currentHighScore = document.getElementById('highscore').textContent
    if (Number(score) > Number(currentHighScore)) {
        getUserId().then(userId => {
            database.updateDocument(
                databaseId,
                collectionId,
                userId,
                {
                    "userId" : userId,
                    "highscore" : score
                }
            ).then(() => {
                showScore()
            }).then(error => console.error(error))
        })
    }
}

async function showScore() {
    const userId = await getUserId();
    database.listDocuments(
        databaseId,
        collectionId,
        [Query.equal("userId", userId)]
    ).then(response => {
        const highscoreElement = document.getElementById('highscore');
        highscoreElement.textContent = response.documents[0].highscore;
    }).catch(error => console.error(error));
}

document.addEventListener('DOMContentLoaded', () => {
    displayUsername();
    showScore();
});

function register(event) {
    account.create(
        ID.unique(),
        event.target.elements['register-email'].value,
        event.target.elements['register-password'].value,
        event.target.elements['register-username'].value
    ).then(response => {
        database.createDocument(
            databaseId,
            collectionId,
            response.$id,
            {
                userId: response.$id,
                highscore: 0
            }
        );
        account.createEmailSession(
            event.target.elements['register-email'].value,
            event.target.elements['register-password'].value
        ).then(() => {
            showDisplay();
            displayUsername();
            showScore();
        });
    }).catch(error => console.error(error));
    event.preventDefault();
}

function login(event) {
    account.createEmailSession(
        event.target.elements['login-email'].value,
        event.target.elements['login-password'].value
    ).then(() => {
        alert('Session created successfully');
        showDisplay();
        displayUsername();
        client.subscribe("account", response => {
            console.log(response);
        });
    }).catch(error => {
        alert('Failed to create session');
        console.error(error);
    });
    event.preventDefault();
}

function logout() {
    account.deleteSessions().then(() => {
        alert('Logged Out');
        showDisplay();
        const highScoreElement = document.getElementById('highscore');
        highScoreElement.textContent = "";
    }).catch(error => console.error(error));
}

function toggleModal(event) {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');

    if (event.srcElement.id === 'register-button') {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        loginButton.classList.add('not-active');
        registerButton.classList.remove('not-active');
    }
    if (event.srcElement.id === 'login-button') {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        loginButton.classList.remove('not-active');
        registerButton.classList.add('not-active');
    }
}

function showDisplay() {
    const modalElement = document.getElementById('modal');
    modalElement.classList.add('hidden');
    isLoggedIn().then(isLogin => {
        if (isLogin) {
            modalElement.classList.add('hidden');
            const logoutButton = document.getElementById('logout-button');
            logoutButton.classList.remove('hidden');
            const highScoreTag = document.getElementById('highscore-tag');
            highScoreTag.classList.remove('hidden');
        } else {
            modalElement.classList.remove('hidden');
            const logoutButton = document.getElementById('logout-button');
            logoutButton.classList.add('hidden');
            const highScoreTag = document.getElementById('highscore-tag');
            highScoreTag.classList.add('hidden');
            const usernameElement = document.getElementById('username');
            usernameElement.textContent = "";
            const canvas = document.querySelector('canvas');
            if (canvas) canvas.remove();
        }
    }).catch(error => console.error(error));
}

showDisplay();

// This is our Kaboom game
async function startGame() {
    kaboom({
        global: true,
        fullscreen: true,
        scale: 2,
        clearColor: [0, 0, 0, 1] // makes the background BLACK
    });

    // Speed identifiers
    const moveSpeed = 120;
    const jumpForce = 360;
    const bigJumpForce = 550;
    let currentJumpForce = jumpForce;
    const fallDeath = 400;
    const enemySpeed = 20;

    // Game logic
    let isJumping = true;

    loadRoot('https://i.imgur.com/');
    loadSprite('coin', 'wbKxhcd.png');
    loadSprite('evil-shroom', 'KPO3fR9.png');
    loadSprite('brick', 'pogC9x5.png');
    loadSprite('block', 'M6rwarW.png');
    loadSprite('mario', 'Wb1qfhK.png');
    loadSprite('mushroom', '0wMd92p.png');
    loadSprite('surprise', 'gesQ1KP.png');
    loadSprite('unboxed', 'bdrLpi6.png');
    loadSprite('pipe-top-left', 'ReTPiWY.png');
    loadSprite('pipe-top-right', 'hj2GK4n.png');
    loadSprite('pipe-bottom-left', 'c1cYSbt.png');
    loadSprite('pipe-bottom-right', 'nqQ79eI.png');
    loadSprite('blue-block', 'fVscIbn.png');
    loadSprite('blue-brick', '3e5YRQd.png');
    loadSprite('blue-steel', 'gqVoI2b.png');
    loadSprite('blue-evil-mushroom', 'SvV4ueD.png');
    loadSprite('blue-surprise', 'RMqCc1G.png');

    const userId = await getUserId();

    scene("game", ({ level, score }) => {
        layers(["bg", "obj", "ui"], "obj");

        const maps = [
            [
                '                                      ',
                '                                      ',
                '                                      ',
                '                                      ',
                '                                      ',
                '     %   =*=%=                        ',
                '                                      ',
                '                            -+        ',
                '                ^     ^     ()        ',
                '==============================   ====='
            ],
            [
                '£                                           £',
                '£                                           £',
                '£                                           £',
                '£                                           £',
                '£                                           £',
                '£     @@@@@                      x x        £',
                '£                              x x x        £',
                '£                            x x x x   x  -+£',
                '£              z     z     x x x x x   x  ()£',
                '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
            ]
        ];

        const levelCfg = {
            width: 20, // width of each element
            height: 20,
            '=': [sprite('block'), solid()],
            '$': [sprite('coin'), 'coin'],
            '%': [sprite('surprise'), solid(), 'coin-surprise'],
            '*': [sprite('surprise'), solid(), 'mushroom-surprise'],
            '}': [sprite('unboxed'), solid()],
            '(': [sprite('pipe-bottom-left'), solid(), scale(0.5)],
            ')': [sprite('pipe-bottom-right'), solid(), scale(0.5)],
            '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
            '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
            '^': [sprite('evil-shroom'), solid(), 'dangerous'],
            '#': [sprite('mushroom'), solid(), 'mushroom', body()],
            '!': [sprite('blue-block'), solid(), scale(0.5)],
            '£': [sprite('blue-brick'), solid(), scale(0.5)],
            'a': [sprite('blue-evil-mushroom'), solid(), scale(0.5), 'dangerous'],
            '@': [sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
            'x': [sprite('blue-steel'), solid(), scale(0.5)],
        };

        const gameLevel = addLevel(maps[level], levelCfg);

        const scoreLabel = add([
            text(score),
            pos(30, 6),
            layer('ui'),
            {
                value: score
            }
        ]);

        add([text(' level ' + parseInt(level + 1)), pos(40, 6)]);

        // Fetch and display the high score
        database.listDocuments(
            databaseId,
            collectionId,
            [Query.equal("userId", userId)]
        ).then(response => {
            if (response.documents.length > 0) {
                highScoreLabel.value = response.documents[0].highscore;
                highScoreLabel.text = 'HighScore: ' + highScoreLabel.value;
            }
        }).catch(error => console.error(error));

        const player = add([
            sprite('mario', solid()),
            pos(30, 140),
            body(),
            big(),
            origin('bot')
        ]);

        function big() {
            let timer = 0;
            let isBig = false;
            return {
                update() { // kaboom function
                    if (isBig) {
                        currentJumpForce = bigJumpForce;
                        timer -= dt(); // dt is kaboom function
                        if (timer <= 0) {
                            this.smallify();
                        }
                    }
                },
                isBig() {
                    return isBig;
                },
                smallify() {
                    this.scale = vec2(1);
                    currentJumpForce = jumpForce;
                    timer = 0;
                    isBig = false;
                },
                biggify(time) {
                    this.scale = vec2(2);
                    currentJumpForce = bigJumpForce;
                    timer = time;
                    isBig = true;
                }
            };
        }

        player.on("headbump", (obj) => {
            if (obj.is('coin-surprise')) {
                gameLevel.spawn('$', obj.gridPos.sub(0, 1));
                destroy(obj);
                gameLevel.spawn('}', obj.gridPos.add(0, 0));
            }
            if (obj.is('mushroom-surprise')) {
                gameLevel.spawn('#', obj.gridPos.sub(0, 1));
                destroy(obj);
                gameLevel.spawn('}', obj.gridPos.add(0, 0));
            }
        });

        action('mushroom', (m) => {
            m.move(20, 0);
        });

        player.collides('mushroom', (m) => {
            destroy(m);
            player.biggify(6);
        });

        player.collides('coin', (c) => {
            destroy(c);
            scoreLabel.value++;
            scoreLabel.text = scoreLabel.value;
        });

        action('dangerous', (d) => {
            d.move(-enemySpeed, 0);
        });

        player.collides('dangerous', (d) => {
            if (isJumping) {
                destroy(d);
                scoreLabel.value++;
                scoreLabel.text = scoreLabel.value;
            } else {
                go('lose', { score: scoreLabel.value });
            }
        });

        player.action(() => {
            camPos(player.pos);
            if (player.pos.y >= fallDeath) {
                go('lose', { score: scoreLabel.value });
            }
        });

        player.collides('pipe', () => {
            keyPress('down', () => {
                go('game', {
                    level: (level + 1) % maps.length,
                    score: scoreLabel.value
                });
            });
        });

        keyDown('left', () => {
            player.move(-moveSpeed, 0);
        });

        keyDown('right', () => {
            player.move(moveSpeed, 0);
        });

        player.action(() => {
            if (player.grounded()) {
                isJumping = false;
            }
        });

        keyPress('up', () => {
            if (player.grounded()) {
                isJumping = true;
                player.jump(currentJumpForce);
            }
        });

        keyPress('space', () => {
            if (player.grounded()) {
                isJumping = true;
                player.jump(currentJumpForce);
            }
        });

        scene('lose', ({ score }) => {
            add([text(score, 32), origin('center'), pos(width() / 2, height() / 2)]);
            updateScore(score)
        });
    });

    start("game", { level: 0, score: 0 });
}

startGame();
