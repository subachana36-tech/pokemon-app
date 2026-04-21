const pokedex = document.getElementById('pokedex');
const searchResults = document.getElementById('search-results');
const explanationCard = document.getElementById('explanation-card');
const dataCardWrapper = document.getElementById('data-card-wrapper');
const searchSection = document.getElementById('search-section');

let pokemonChart = null;
const searchInput = document.getElementById('pokemon-search');
const searchBtn = document.getElementById('search-btn');

const POKEMON_COUNT = 151; // 初代151匹

// タイプ名の日本語対応表
const TYPE_MAP = {
    fire: 'ほのお',
    water: 'みず',
    grass: 'くさ',
    electric: 'でんき',
    psychic: 'エスパー',
    ice: 'こおり',
    dragon: 'ドラゴン',
    dark: 'あく',
    fairy: 'フェアリー',
    normal: 'ノーマル',
    fighting: 'かくとう',
    flying: 'ひこう',
    poison: 'どく',
    ground: 'じめん',
    rock: 'いわ',
    bug: 'むし',
    ghost: 'ゴースト',
    steel: 'はがね'
};

// 初期化時に全てのポケモンデータを保持する配列
let allPokemons = [];

async function fetchPokemons() {
    pokedex.innerHTML = '<div class="loader"><div class="pokeball"></div><p>読み込み中...</p></div>';
    const promises = [];
    
    for (let i = 1; i <= POKEMON_COUNT; i++) {
        const pokemonPromise = fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json());
        const speciesPromise = fetch(`https://pokeapi.co/api/v2/pokemon-species/${i}`).then(res => res.json());
        
        promises.push(Promise.all([pokemonPromise, speciesPromise]).then(([pokemon, species]) => {
            const jaName = species.names.find(n => n.language.name === 'ja').name;
            const flavorEntry = species.flavor_text_entries.find(entry => entry.language.name === 'ja');
            const description = flavorEntry ? flavorEntry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') : '説明はありません。';
            return { ...pokemon, japanese_name: jaName, description: description };
        }));
    }
    
    allPokemons = await Promise.all(promises);
    displayPokemons(allPokemons);
}

function displayPokemons(pokemons, container = pokedex) {
    container.innerHTML = '';
    pokemons.forEach(pokemon => {
        const card = document.createElement('div');
        card.classList.add('pokemon-card');
        
        const types = pokemon.types.map(t => {
            const jaType = TYPE_MAP[t.type.name] || t.type.name;
            return `<span class="type-badge" style="background-color: var(--${t.type.name})">${jaType}</span>`;
        }).join('');
        
        const id = pokemon.id.toString().padStart(3, '0');
        
        card.innerHTML = `
            <p class="id">#${id}</p>
            <img src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.japanese_name}">
            <h2 class="name">${pokemon.japanese_name}</h2>
            <div class="types">${types}</div>
        `;
        
        // カードをクリックした時
        card.addEventListener('click', () => {
            searchInput.value = pokemon.japanese_name;
            performSearch(pokemon.japanese_name);
            // 検索結果にスクロール
            searchSection.scrollIntoView({ behavior: 'smooth' });
        });
        
        container.appendChild(card);
    });
}

function createRadarChart(canvasId, pokemon) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // ステータスの抽出
    const stats = {
        hp: pokemon.stats.find(s => s.stat.name === 'hp').base_stat,
        attack: pokemon.stats.find(s => s.stat.name === 'attack').base_stat,
        defense: pokemon.stats.find(s => s.stat.name === 'defense').base_stat,
        spAtk: pokemon.stats.find(s => s.stat.name === 'special-attack').base_stat,
        spDef: pokemon.stats.find(s => s.stat.name === 'special-defense').base_stat,
        speed: pokemon.stats.find(s => s.stat.name === 'speed').base_stat
    };

    const data = {
        labels: ['HP', 'こうげき', 'ぼうぎょ', 'とくこう', 'とくぼう', 'すばやさ'],
        datasets: [{
            label: '種族値',
            data: [stats.hp, stats.attack, stats.defense, stats.spAtk, stats.spDef, stats.speed],
            fill: true,
            backgroundColor: 'rgba(255, 83, 80, 0.2)',
            borderColor: 'rgb(255, 83, 80)',
            pointBackgroundColor: 'rgb(255, 83, 80)',
            pointBorderColor: '#fff'
        }]
    };

    if (pokemonChart) pokemonChart.destroy();

    pokemonChart = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                    grid: { color: 'rgba(255, 255, 255, 0.2)' },
                    pointLabels: { color: '#f8fafc', font: { size: 12 } },
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 150
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderDataCard(pokemon) {
    const hp = pokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    const attack = pokemon.stats.find(s => s.stat.name === 'attack').base_stat;
    const defense = pokemon.stats.find(s => s.stat.name === 'defense').base_stat;
    const spAtk = pokemon.stats.find(s => s.stat.name === 'special-attack').base_stat;
    const spDef = pokemon.stats.find(s => s.stat.name === 'special-defense').base_stat;
    const speed = pokemon.stats.find(s => s.stat.name === 'speed').base_stat;

    // 「せつめい」カードの内容を更新
    explanationCard.innerHTML = `
        <p class="explanation-title">せつめい</p>
        <div class="explanation-row">
            <div class="explanation-item">
                <span class="explanation-label">しんちょう</span>
                <span class="explanation-value">${pokemon.height / 10} m</span>
            </div>
            <div class="explanation-item">
                <span class="explanation-label">たいじゅう</span>
                <span class="explanation-value">${pokemon.weight / 10} kg</span>
            </div>
        </div>
        <div class="explanation-description" style="margin-top: 1.5rem; text-align: left; line-height: 1.6; font-size: 0.95rem; color: var(--text-white); background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border);">
            ${pokemon.description}
        </div>
    `;
    explanationCard.style.display = 'block';

    dataCardWrapper.innerHTML = `
        <div class="data-stats-section" style="border-top: none; padding-top: 0;">
            <div class="radar-box">
                <h3 class="sub-heading">種族値</h3>
                <canvas id="pokemon-radar"></canvas>
            </div>
            <div class="text-stats-box">
                <div class="text-stat-row"><span class="text-stat-label">HP</span><span class="text-stat-value">${hp}</span></div>
                <div class="text-stat-row"><span class="text-stat-label">こうげき</span><span class="text-stat-value">${attack}</span></div>
                <div class="text-stat-row"><span class="text-stat-label">ぼうぎょ</span><span class="text-stat-value">${defense}</span></div>
                <div class="text-stat-row"><span class="text-stat-label">とくこう</span><span class="text-stat-value">${spAtk}</span></div>
                <div class="text-stat-row"><span class="text-stat-label">とくぼう</span><span class="text-stat-value">${spDef}</span></div>
                <div class="text-stat-row"><span class="text-stat-label">すばやさ</span><span class="text-stat-value">${speed}</span></div>
            </div>
        </div>
    `;

    createRadarChart('pokemon-radar', pokemon);
}

// 検索実行関数
function performSearch(query) {
    query = query.trim().toLowerCase();
    
    if (query === '') {
        searchSection.style.display = 'none';
        return;
    }

    const filtered = allPokemons.filter(pokemon => {
        return (
            pokemon.japanese_name.includes(query) ||
            pokemon.name.toLowerCase().includes(query) ||
            pokemon.id.toString() === query
        );
    });

    if (filtered.length > 0) {
        searchSection.style.display = 'block';
        displayPokemons(filtered, searchResults);
        // 最初に見つかったポケモンのデータカードを表示
        renderDataCard(filtered[0]);
    } else {
        searchSection.style.display = 'block';
        dataCardWrapper.innerHTML = '<p style="text-align: center;">ポケモンが見つかりませんでした。</p>';
        explanationCard.style.display = 'none';
        searchResults.innerHTML = '';
    }
}

const mainTitle = document.getElementById('main-title');

// タイトルクリックで初期状態に戻す
mainTitle.addEventListener('click', () => {
    searchInput.value = '';
    searchSection.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 検索機能イベント
searchBtn.addEventListener('click', () => {
    performSearch(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch(searchInput.value);
});

// 初期読み込み
fetchPokemons();
