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
            <!-- Left: Packs Grid -->
            <div class="packs-grid">
                <div v-for="(pack, i) in packs" class="pack-card" :style="{backgroundImage: 'url(' + pack.image + ')'}">
                    <div class="pack-name">{{ pack.name }}</div>
                    <div class="levels">
                        <button v-for="(level, j) in pack.levels" 
                                @click="selectLevel(i,j)" 
                                :class="{active: selectedPackIndex === i && selectedLevelIndex === j, error: !level[0]}">
                            {{ level[0]?.level.name || \`Error (\${level[1]}.json)\` }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right: Level Info -->
            <div class="level-container">
                <div class="level" v-if="selectedLevelObj">
                    <h1>{{ selectedLevelObj.level.name }}</h1>
                    <LevelAuthors 
                        :author="selectedLevelObj.level.author" 
                        :creators="selectedLevelObj.level.creators" 
                        :verifier="selectedLevelObj.level.verifier">
                    </LevelAuthors>
                    <div class="level-packs">
                        <div v-for="pack in selectedLevelObj.level.packs" class="tag" 
                             :style="{background: pack.colour, color: getFontColour(pack.colour)}">
                            {{ pack.name }}
                        </div>
                    </div>
                    <div v-if="selectedLevelObj.level.showcase" class="tabs">
                        <button class="tab" :class="{selected: !toggledShowcase}" @click="toggledShowcase=false">Verification</button>
                        <button class="tab" :class="{selected: toggledShowcase}" @click="toggledShowcase=true">Showcase</button>
                    </div>
                    <iframe class="video" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Lygio ID</div>
                            <p>{{ selectedLevelObj.level.id }}</p>
                        </li>
                    </ul>
                    <h2>Rekordai</h2>
                    <table class="records">
                        <tr v-for="record in selectedLevelObj.records">
                            <td class="enjoyment"><p>100%</p></td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level empty">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        store,
        packs: [],
        errors: [],
        selectedPackIndex: 0,
        selectedLevelIndex: 0,
        selectedPackLevels: [],
        loading: true,
        toggledShowcase: false,
    }),
    computed: {
        selectedLevelObj() {
            return this.selectedPackLevels?.[this.selectedLevelIndex]?.[0] || null;
        },
        video() {
            if (!this.selectedLevelObj) return '';
            const level = this.selectedLevelObj.level;
            if (!level.showcase) return embed(level.verification);
            return embed(this.toggledShowcase ? level.showcase : level.verification);
        },
    },
    async mounted() {
        await this.loadPack(this.selectedPackIndex);
        this.loading = false;
    },
    methods: {
        async loadPack(packIndex) {
            const pack = this.packs[packIndex] || (this.packs = await fetchPacks())[packIndex];
            if (!pack) {
                this.errors.push("Nepavyko pakrauti sąrašo.");
                return;
            }
            this.selectedPackLevels = await fetchPackLevels(pack.name);
        },
        async selectLevel(packIndex, levelIndex) {
            this.selectedPackIndex = packIndex;
            this.selectedLevelIndex = levelIndex;

            // Reload levels if pack changed
            if (!this.selectedPackLevels[levelIndex]) {
                this.selectedPackLevels = await fetchPackLevels(this.packs[packIndex].name);
            }
        },
        score,
        embed,
        getFontColour,
    },
};
