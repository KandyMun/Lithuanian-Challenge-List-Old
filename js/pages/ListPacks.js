import { fetchPacks, fetchPackLevels } from "../content.js";
import { getFontColour, embed } from "../util.js";
import { score } from "../score.js";
import { store } from "../main.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="pack-list">
            <h1 class="page-title">PAKELIAI</h1>
            <div class="packs-grid">
                <div v-for="(pack, i) in packs" class="pack-card" :style="{ backgroundImage: pack.colour }">
                    <h2 class="pack-name">{{ pack.name }}</h2>
                    <div class="levels">
                        <button v-for="(level, j) in selectedPackLevelsByIndex[i]" 
                                :class="{active: selectedPackIndex === i && selectedLevelIndex === j, error: !level[0]}"
                                @click="selectLevel(i,j)">
                            {{ level[0]?.level?.name || \`Error (\${level[1]}.json)\` }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="level-container" v-if="selectedLevelObj">
                <div class="level-info">
                    <h1>{{ selectedLevelObj.level.name }}</h1>
                    <LevelAuthors 
                        :author="selectedLevelObj.level.author" 
                        :creators="selectedLevelObj.level.creators" 
                        :verifier="selectedLevelObj.level.verifier"
                    />
                    <div class="level-tags">
                        <div v-for="pack in selectedLevelObj.level.packs" class="tag" 
                             :style="{background:pack.colour, color:getFontColour(pack.colour)}">
                            {{ pack.name }}
                        </div>
                    </div>
                    <div v-if="selectedLevelObj.level.showcase" class="tabs">
                        <button class="tab" :class="{selected: !toggledShowcase}" @click="toggledShowcase = false">
                            Verification
                        </button>
                        <button class="tab" :class="{selected: toggledShowcase}" @click="toggledShowcase = true">
                            Showcase
                        </button>
                    </div>
                    <iframe class="video" :src="video" frameborder="0"></iframe>

                    <ul class="stats">
                        <li>
                            <div>Lygio ID</div>
                            <p>{{ selectedLevelObj.level.id }}</p>
                        </li>
                    </ul>

                    <h2>Rekordai</h2>
                    <table class="records">
                        <tr v-for="record in selectedLevelObj.records" class="record">
                            <td class="enjoyment">
                                <p>{{ record.percent || '100%' }}</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-if="errors.length">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <h3>Kaip gauti pakelius?</h3>
                    <p>
                        Pereikite visus pakelyje esančius lygius ir į #pakelių-prašymas parašykit kokį pakelį perėjote.
                        Jei lygis yra legacy ir įveikėt jį po jo iškritimo iš list'o, turėsit atsiųst įveikimo video.
                    </p>
                    <p> Pakelių funkciją sukurė KrisGra. </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        store,
        packs: [],
        selectedPackLevelsByIndex: [],
        selectedPackIndex: 0,
        selectedLevelIndex: 0,
        selectedLevelObj: null,
        errors: [],
        loading: true,
        toggledShowcase: false,
    }),
    computed: {
        video() {
            if (!this.selectedLevelObj) return '';
            const level = this.selectedLevelObj.level;
            if (!level.showcase) return embed(level.verification);
            return embed(this.toggledShowcase ? level.showcase : level.verification);
        }
    },
    async mounted() {
        try {
            this.packs = await fetchPacks();
            const levelsPromises = this.packs.map(pack => fetchPackLevels(pack.name));
            this.selectedPackLevelsByIndex = await Promise.all(levelsPromises);
            
            this.selectLevel(0,0);

            // Check for any level load errors
            this.selectedPackLevelsByIndex.forEach(packLevels => {
                packLevels.forEach(([level, err]) => {
                    if (err) this.errors.push(`Nepavyko pakrauti lygio. (${err}.json)`);
                });
            });
        } catch(e) {
            this.errors.push("Nepavyko pakrauti sąrašo. Pabandykite po kelių minučių arba praneškite sąrašo moderatoriams.");
        } finally {
            this.loading = false;
        }
    },
    methods: {
        selectLevel(packIndex, levelIndex) {
            this.selectedPackIndex = packIndex;
            this.selectedLevelIndex = levelIndex;
            const lvl = this.selectedPackLevelsByIndex?.[packIndex]?.[levelIndex]?.[0];
            this.selectedLevelObj = lvl && lvl.level ? lvl : null;
        },
        getFontColour,
        embed,
        score,
    },
};
