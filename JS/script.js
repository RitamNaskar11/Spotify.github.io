let audio = new Audio();
let songs;
let currFolder;

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);

    if (minutes < 10) minutes = "0" + minutes;
    if (secs < 10) secs = "0" + secs;

    return `${minutes}:${secs}`;
}

async function getSongs(folder) {
    currFolder = folder;
    // ✅ Use relative path (works on localhost + deployment)
    let a = await fetch(`${folder}`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    let links = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < links.length; index++) {
        const element = links[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="invert" src="File.svg/music.svg" alt="">
                <div class="song-details">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Spotify</div>
                </div>
                <img class="invert" src="File.svg/play.svg" alt="">
            </li>`;
    }

    Array.from(document.querySelectorAll(".songList ul li")).forEach(e => {
        e.addEventListener("click", () => {
            let trackName = e.querySelector(".song-details div").textContent.trim();
            playMusic(trackName);
        });
    });

    return songs;
}

function playMusic(trackName, pause = false) {
    let songPath = `/${currFolder}/` + trackName.trim();
    audio.src = songPath;

    if (!pause) {
        audio.play().then(() => {
            play.src = "File.svg/pause.svg";
        }).catch(err => console.log("Play blocked:", err));
    }

    document.querySelector(".song-Info").innerHTML = decodeURI(trackName);
    document.querySelector(".songTime").innerHTML = "00:00/00:00";
}

async function displayAlbums() {
    // ✅ Use relative path
    let res = await fetch(`songs/`);
    let response = await res.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");

    let cardContainer = document.querySelector(".cardContainer");

    Array.from(anchors).forEach(async e => {
        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/").slice(-1)[0];
            let a = await fetch(`songs/${folder}/info.json`);
            let response = await a.json();

            cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                        <img src="songs/${folder}/cover.jpg" alt="Song cover" class="cover">
                        <button class="play-btn"></button>
                        <h2 class="play">${response.title}</h2>
                        <p>${response.description}</p>
                    </div>`;
        }

        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0]);
            });
        });
    });
}

displayAlbums();

async function main() {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    play.addEventListener("click", () => {
        if (audio.paused) {
            audio.play();
            play.src = "File.svg/pause.svg";
        } else {
            audio.pause();
            play.src = "File.svg/play.svg";
        }
    });

    audio.addEventListener("timeupdate", () => {
        let current = formatTime(audio.currentTime);
        let total = formatTime(audio.duration);
        document.querySelector(".songTime").innerHTML = `${current} / ${total}`;
        document.querySelector(".circle").style.left = (audio.currentTime / audio.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        audio.currentTime = (audio.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".closehamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        audio.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector(".vol>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            audio.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            audio.volume = 0.10;
            document.querySelector(".range input").value = 10;
        }
    });

    previous.addEventListener("click", () => {
        let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        audio.pause();
        let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    if (songs.length > 0) {
        playMusic(songs[0], true);
    } else {
        console.error("No songs found in folder:", currFolder);
    }
}

main();
