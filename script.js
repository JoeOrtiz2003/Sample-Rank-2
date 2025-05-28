
const sheetID = "1srwCRcCf_grbInfDSURVzXXRqIqxQ6_IIPG-4_gnSY8";
const sheetName = "LIVE";
const query = "select AZ, BA, BB, BC, BD";
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&tq=${encodeURIComponent(query)}`;

let previousRanks = {};

function createRankingElements(count = 20) {
    const wrapper = document.getElementById("rankingElementsWrapper");
    wrapper.innerHTML = "";

    for (let i = 1; i <= count; i++) {
        const div = document.createElement("div");
        div.className = "rankingElement";
        div.setAttribute("data-position", i);
        div.innerHTML = `
            <div class="rankingElementBackground"></div>
            <div class="rankingElementWrapper">
                <p class="rankingElementRank"></p>
                <div class="rankingElementLogoWrapper">
                    <div class="rankingElementNoLogo"></div>
                    <img class="rankingElementLogo" src="logo.png" alt="Logo" />
                    <p class="rankingElementName"></p>
                </div>
                <div class="rankingElementAliveWrapper">
                    <div class="rankingElementAlive"></div>
                    <div class="rankingElementAlive"></div>
                    <div class="rankingElementAlive"></div>
                    <div class="rankingElementAlive"></div>
                </div>
                <p class="rankingElementKills"></p>
            </div>
        `;
        wrapper.appendChild(div);
    }
}

async function fetchRankingData() {
    try {
        const response = await fetch(sheetURL);
        const text = await response.text();
        const jsonText = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
        if (!jsonText) throw new Error("Invalid JSON format");

        const jsonData = JSON.parse(jsonText[1]);
        const rows = jsonData.table.rows.map(row => ({
            rank: row.c[0]?.v ?? "#",
            team: row.c[1]?.v?.toString().trim() ?? "Unknown",
            elims: row.c[2]?.v ?? 0,
            logo: row.c[3]?.v ?? "https://placehold.co/22x22/000000/FFF?text=?",
            alive: row.c[4]?.v ?? 0
        }));

        updateRankingElements(rows);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

function updateRankingElements(data) {
    const wrapper = document.getElementById("rankingElementsWrapper");
    const newRanks = {};
    data.forEach((team, index) => {
        newRanks[team.team] = index;
    });

    data.forEach((teamData, index) => {
        const element = document.querySelector(`.rankingElement[data-position="${index + 1}"]`);
        if (!element) return;

        const prevIndex = previousRanks[teamData.team];
        if (prevIndex !== undefined && prevIndex !== index) {
            const direction = index < prevIndex ? "slide-up" : "slide-down";
            element.classList.add(direction);
            element.addEventListener("animationend", () => {
                element.classList.remove(direction);
            }, { once: true });
        }

        element.querySelector(".rankingElementRank").textContent = `#${teamData.rank}`;
        element.querySelector(".rankingElementName").textContent = teamData.team;
        element.querySelector(".rankingElementLogo").src = teamData.logo;
        element.querySelector(".rankingElementKills").textContent = teamData.elims;

        const aliveBoxes = element.querySelectorAll(".rankingElementAlive");
        aliveBoxes.forEach((box, i) => {
            box.style.backgroundColor = i < teamData.alive ? "#ffff" : "#141414";
        });

        if (teamData.alive === 0) {
            element.classList.add("fadedTeam");
        } else {
            element.classList.remove("fadedTeam");
        }
    });

    previousRanks = newRanks;
}

createRankingElements(20);
fetchRankingData();
setInterval(fetchRankingData, 1000);