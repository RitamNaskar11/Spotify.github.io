

let audio = new Audio();
let songs;
let currFolder;

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);

    // Add leading zeros if needed
    if (minutes < 10) minutes = "0" + minutes;
    if (secs < 10) secs = "0" + secs;

    return `${minutes}:${secs}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
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

    let songUL = document.querySelector(".songList ul"); // ✅ fixed selector
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

    // ✅ attach click event correctly
    Array.from(document.querySelectorAll(".songList ul li")).forEach(e => {
        e.addEventListener("click", () => {
            let trackName = e.querySelector(".song-details div").textContent.trim();
            playMusic(trackName);
        });
    });

    return songs;
}

function playMusic(trackName, pause = false) {
    let songPath = `/${currFolder}/` + (trackName.trim());

    // set the audio player to use the song
    audio.src = songPath

    // then try to play the song
    if (!pause)
        audio.play().then(() => {
            play.src = "File.svg/pause.svg"

        }).catch(err => console.log("Play blocked:", err));

    console.log("Songs loaded:", songs);
    document.querySelector(".song-Info").innerHTML = decodeURI(trackName)
    document.querySelector(".songTime").innerHTML = "00:00/00:00"
}

async function displayAlbums() {
    let res = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await res.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");

    let cardContainer = document.querySelector(".cardContainer");

    Array.from(anchors).forEach(async e => {
        if (e.href.includes("/songs/")) {
            // ✅ get folder name correctly
            let folder = e.href.split("/").slice(-1)[0];
                let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                let response = await a.json();

                 cardContainer.innerHTML= cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                        <img src="songs/${folder}/cover.jpg" alt="Song cover" class="cover">
                        <button class="play-btn"></button>
                        <h2 class="play">${response.title}</h2>
                        <p>${response.description}</p>
                    </div>`;
            
        }

        // Load the playlist when click the card 
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                console.log(item, item.currentTarget.dataset);
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
                playMusic(songs[0])
            })
        });
    });
}

// Display the all album in the page 
displayAlbums()


async function main() {
    // get the list of all the song
    await getSongs("songs/ncs")
    console.log(songs);
    playMusic(songs[0], true)





    // Attached addEventlistner to play, next and previous
    play.addEventListener("click", () => {
        if (audio.paused) {
            audio.play()
            play.src = "File.svg/pause.svg"
        }
        else {
            audio.pause()
            play.src = "File.svg/play.svg"
        }
    })

    //  time update for playing song

    audio.addEventListener("timeupdate", () => {
        let current = formatTime(audio.currentTime);
        let total = formatTime(audio.duration);

        document.querySelector(".songTime").innerHTML = `${current} / ${total}`;
        document.querySelector(".circle").style.left = (audio.currentTime / audio.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        audio.currentTime = ((audio.duration) * percent) / 100;
    })

    // Add an event listener for hamburger 
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })
    // Add an event listener for close hamburger 
    document.querySelector(".closehamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    // Add event listener in volume 
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Volume", e.target.value, "/100")
        audio.volume = parseInt(e.target.value) / 100;

    })


    document.querySelector(".vol>img"). addEventListener("click", e => {
        // console.log(e.target)
        // console.log("changing", e.target.src)
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            audio.volume = 0
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            audio.volume = .10
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })

    // Add event listener in previous button
    previous.addEventListener("click", () => {

        let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    })

    // Add event listener in next button
    next.addEventListener("click", () => {
        audio.pause();
        let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    })
    if (songs.length > 0) {
        playMusic(songs[0], true);
    } else {
        console.error("No songs found in folder:", currFolder);
    }

}
main()

