import { fetchPacks, fetchPackLevels } from "../content.js";
import { getFontColour, embed } from "../util.js";
import { score } from "../score.js";
import { store } from "../main.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

export default {
    components: {
        Spinner,
        LevelAuthors,
    },
    template: `
    <main v-if="loading">
        <Spinner></Spinner>
    </main>
    <main v-else class="pack-list">
        <h1 class="pack-title">PAKELIAI</h1>

        <div class="packs-grid">
            <div 
                class="pack-card" 
                v-for="(pack, packIndex) in packs" 
                :key="pack.name"
                :style="{ backgroundImage: 'url(' + pack.image + ')' }"
            >
                <div class="pack-name">{{ pack.name }}</div>
                <div class="levels">
                    <button 
                        v-for="(level, levelIndex) in pack.levels" 
                        :key="level[1] || level.level?.id"
                        :class="{ active: selectedLevelIndex === levelIndex && selectedPackIndex === packIndex }"
                        @click="selectLevel(packIndex, levelIndex)"
                    >
                        {{ level[0]?.level?.name || \`Error (\${level[1]}.json)\` }}
                    </button>
                </div>
            </div>
        </div>

        <div class="level-container" v-if="selectedPackLevels.length && selectedLevelIndex !== null">
            <div v-if="selectedPackLevels[selectedLevelIndex]?.[0]">
                <h1>{{ selectedPackLevels[selectedLevelIndex][0].level.name }}</h1>

                <LevelAuthors 
                    :author="selectedPackLevels[selectedLevelIndex][0].level.author" 
                    :creators="selectedPackLevels[selectedLevelIndex][0].level.creators" 
                    :verifier="selectedPackLevels[selectedLevelIndex][0].level.verifier"
                ></LevelAuthors>

                <div class="packs">
                    <div 
                        v-for="pack in selectedPackLevels[selectedLevelIndex][0].level.packs" 
                        class="tag" 
                        :style="{ background: pack.colour, color: getFontColour(pack.colour) }"
                    >
                        {{ pack.name }}
                    </div>
                </div>

                <iframe class="video" :src="video" frameborder="0"></iframe>

                <ul class="stats">
                    <li>
                        <div class="type-title-sm">Lygio ID</div>
                        <p>{{ selectedPackLevels[selectedLevelIndex][0].level.id }}</p>
                    </li>
                </ul>

                <h2>Rekordai</h2>
                <table class="records">
                    <tr v-for="record in selectedPackLevels[selectedLevelIndex][0].records" class="record">
                        <td class="enjoyment">
                            <p>100%</p>
                        </td>
                        <td class="user">
                            <a :href="record.link" target="_blank">{{ record.user }}</a>
                        </td>
                        <td class="mobile">
                            <img v-if="record.mobile" :src="'/assets/phone-landscape' + (store?.dark ? '-dark' : '') + '.svg'" alt="Mobile">
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </main>
    `,
    data: () => ({
        store,
        packs: [],
        selectedPackIndex: 0,
        selectedLevelIndex: 0,
        selectedPackLevels: [],
        loading: true,
        errors: [],
    }),
    computed: {
        video() {
            const lvl = this.selectedPackLevels[this.selectedLevelIndex]?.[0]?.level;
            if (!lvl) return '';
            return embed(lvl.showcase ? lvl.showcase : lvl.verification);
        },
    },
    async mounted() {
        try {
            this.packs = await fetchPacks();

            // Fetch levels for the first pack by default
            if (this.packs.length) {
                this.selectedPackLevels = await fetchPackLevels(this.packs[this.selectedPackIndex].name);
            }
        } catch (err) {
            this.errors.push("Nepavyko pakrauti sąrašo.");
        } finally {
            this.loading = false;
        }
    },
    methods: {
        async selectLevel(packIndex, levelIndex) {
            this.selectedPackIndex = packIndex;
            this.selectedLevelIndex = levelIndex;

            const packName = this.packs[packIndex].name;
            this.selectedPackLevels = await fetchPackLevels(packName);

            // Error handling
            this.errors.length = 0;
            this.errors.push(
                ...this.selectedPackLevels
                    .filter(([_, err]) => err)
                    .map(([_, err]) => `Nepavyko pakrauti lygio. (${err}.json)`)
            );
        },
        getFontColour,
        embed,
        score,
    },
};
