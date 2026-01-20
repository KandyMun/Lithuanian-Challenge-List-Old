import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";
import { fetchPacks, fetchPackLevels } from "../content.js";
import { getFontColour, embed } from "../util.js";
import { score } from "../score.js";
import { store } from "../main.js";

export default {
    components: {
        Spinner,
        LevelAuthors,
    },
    template: `
        <main>
            <div v-if="loading" class="spinner">
                <Spinner></Spinner>
            </div>

            <div v-else class="pack-list">
                <!-- Title -->
                <div class="pack-title">PAKELIAI</div>

                <!-- Packs Grid -->
                <div class="packs-grid">
                    <div v-for="(pack, i) in packs" :key="i" class="pack-card">
                        <div class="pack-name">{{ pack.name }}</div>
                        <div class="levels">
                            <button 
                                v-for="(level, j) in pack.levels" 
                                :key="j"
                                @click="selectLevel(i, j)"
                                :class="{ active: selectedPack === i && selectedLevel === j }">
                                {{ level[0]?.level.name || \`Error (\${level[1]}.json)\` }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Level Info Section -->
                <div class="level-container" v-if="currentLevel">
                    <h1>{{ currentLevel.level.name }}</h1>
                    <LevelAuthors 
                        :author="currentLevel.level.author" 
                        :creators="currentLevel.level.creators" 
                        :verifier="currentLevel.level.verifier">
                    </LevelAuthors>

                    <!-- Level Packs Tags -->
                    <div class="packs">
                        <div 
                            v-for="pack in currentLevel.level.packs" 
                            class="tag" 
                            :style="{ background: pack.colour, color: getFontColour(pack.colour) }">
                            {{ pack.name }}
                        </div>
                    </div>

                    <!-- Video / Showcase -->
                    <iframe class="video" :src="video" frameborder="0"></iframe>

                    <!-- Stats -->
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Lygio ID</div>
                            <p>{{ currentLevel.level.id }}</p>
                        </li>
                    </ul>

                    <!-- Rekordai / Records -->
                    <h2>Rekordai</h2>
                    <table class="records">
                        <tr v-for="record in currentLevel.records" class="record">
                            <td class="enjoyment">
                                <p>100%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>

                    <!-- Errors -->
                    <div class="errors" v-if="errors.length">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        store,
        packs: [],
        errors: [],
        selectedPack: 0,
        selectedLevel: 0,
        loading: true,
    }),
    computed: {
        currentLevel() {
            if (!this.packs[this.selectedPack]?.levels) return null;
            return this.packs[this.selectedPack].levels[this.selectedLevel][0];
        },
        video() {
            if (!this.currentLevel) return "";
            const level = this.currentLevel.level;
            return embed(level.showcase || level.verification);
        },
    },
    async mounted() {
        try {
            const fetchedPacks = await fetchPacks();

            // Fetch levels for each pack
            const packsWithLevels = await Promise.all(
                fetchedPacks.map(async pack => ({
                    ...pack,
                    levels: await fetchPackLevels(pack.name)
                }))
            );

            this.packs = packsWithLevels;

        } catch (err) {
            this.errors.push("Nepavyko pakrauti sąrašo. Pabandykite po kelių minučių.");
            console.error(err);
        }

        this.loading = false;
    },
    methods: {
        selectLevel(packIndex, levelIndex) {
            this.selectedPack = packIndex;
            this.selectedLevel = levelIndex;

            // Reset errors
            this.errors = [];

            const level = this.packs[packIndex].levels[levelIndex];
            if (!level[0]) {
                this.errors.push(`Nepavyko pakrauti lygio. (${level[1]}.json)`);
            }
        },
        getFontColour,
        embed,
        score,
    },
};
