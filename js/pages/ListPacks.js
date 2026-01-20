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
            <!-- Packs Column -->
            <div class="pack-boxes-container">
                <div v-for="(pack, packIndex) in packs" :key="packIndex" class="pack-box" :style="{background: pack.colour}">
                    <h3 class="pack-header type-label-lg">{{ pack.name }}</h3>
                    <div class="pack-levels">
                        <button
                            v-for="(level, i) in packLevels[pack.name]"
                            :key="i"
                            class="pack-level-btn"
                            :class="{active: selectedPack === packIndex && selectedLevel === i, error: !level[0]}"
                            @click="selectLevel(packIndex, i)"
                        >
                            {{ level[0]?.level.name || \`Error (\${level[1]}.json)\` }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Level Info Column -->
            <div class="level-container">
                <div v-if="selectedPackLevels[selectedLevel] && selectedPackLevels[selectedLevel][0]" class="level">
                    <h1>{{ selectedPackLevels[selectedLevel][0].level.name }}</h1>
                    <LevelAuthors
                        :author="selectedPackLevels[selectedLevel][0].level.author"
                        :creators="selectedPackLevels[selectedLevel][0].level.creators"
                        :verifier="selectedPackLevels[selectedLevel][0].level.verifier"
                    ></LevelAuthors>

                    <div style="display:flex; flex-wrap: wrap; gap: 0.5rem;">
                        <div
                            v-for="pack in selectedPackLevels[selectedLevel][0].level.packs"
                            class="tag"
                            :style="{background: pack.colour, color: getFontColour(pack.colour)}"
                        >
                            {{ pack.name }}
                        </div>
                    </div>

                    <div v-if="selectedPackLevels[selectedLevel][0].level.showcase" class="tabs">
                        <button
                            class="tab type-label-lg"
                            :class="{selected: !toggledShowcase}"
                            @click="toggledShowcase = false"
                        >
                            Verification
                        </button>
                        <button
                            class="tab type-label-lg"
                            :class="{selected: toggledShowcase}"
                            @click="toggledShowcase = true"
                        >
                            Showcase
                        </button>
                    </div>

                    <iframe class="video" :src="video" frameborder="0"></iframe>

                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Lygio ID</div>
                            <p>{{ selectedPackLevels[selectedLevel][0].level.id }}</p>
                        </li>
                    </ul>

                    <h2>Rekordai</h2>
                    <table class="records">
                        <tr v-for="record in selectedPackLevels[selectedLevel][0].records" class="record">
                            <td class="enjoyment">
                                <p>100%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="phoneIconSrc" alt="Mobile" />
                            </td>
                        </tr>
                    </table>
                </div>

                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <!-- Errors Only -->
            <div class="meta-container" v-if="errors.length">
                <div class="meta">
                    <div class="errors">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        store,
        packs: [],
        packLevels: {},
        errors: [],
        selectedPack: 0,
        selectedLevel: 0,
        selectedPackLevels: [],
        loading: true,
        toggledShowcase: false,
    }),
    computed: {
        phoneIconSrc() {
            return "/assets/phone-landscape" + (this.store && this.store.dark ? "-dark" : "") + ".svg";
        },
        video() {
            if (!this.selectedPackLevels[this.selectedLevel][0].level.showcase) {
                return embed(this.selectedPackLevels[this.selectedLevel][0].level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.selectedPackLevels[this.selectedLevel][0].level.showcase
                    : this.selectedPackLevels[this.selectedLevel][0].level.verification
            );
        },
    },
    async mounted() {
        this.packs = await fetchPacks();

        // Load levels for all packs
        for (let pack of this.packs) {
            const levels = await fetchPackLevels(pack.name);
            this.packLevels[pack.name] = levels;
        }

        // Select first pack by default
        this.selectedPackLevels = this.packLevels[this.packs[this.selectedPack]?.name] || [];

        // Errors handling
        if (!this.packs.length) {
            this.errors.push("Nepavyko pakrauti sąrašo. Pabandykite po kelių minučių arba praneškite sąrašo moderatoriams.");
        } else {
            this.errors.push(
                ...this.selectedPackLevels
                    .filter(([_, err]) => err)
                    .map(([_, err]) => `Nepavyko pakrauti lygio. (${err}.json)`)
            );
        }

        this.loading = false;
    },
    methods: {
        selectLevel(packIndex, levelIndex) {
            this.selectedPack = packIndex;
            this.selectedLevel = levelIndex;
            this.selectedPackLevels = this.packLevels[this.packs[packIndex].name] || [];

            this.errors = [];
            if (!this.selectedPackLevels.length) {
                this.errors.push("Nepavyko pakrauti lygio sąrašo.");
            } else {
                this.errors.push(
                    ...this.selectedPackLevels
                        .filter(([_, err]) => err)
                        .map(([_, err]) => `Nepavyko pakrauti lygio. (${err}.json)`)
                );
            }

            this.toggledShowcase = false;
        },
        score,
        embed,
        getFontColour,
    },
};
