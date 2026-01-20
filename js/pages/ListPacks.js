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
            <Spinner />
        </main>

        <main v-else class="pack-list">
            <div class="pack-boxes-container">
                <div
                    v-for="(pack, pIndex) in packs"
                    :key="pack.name"
                    class="pack-box"
                    :style="{ background: pack.colour }"
                >
                    <h3 class="pack-header">{{ pack.name }}</h3>

                    <div class="pack-levels">
                        <button
                            v-for="(level, lIndex) in packLevels[pack.name]"
                            :key="lIndex"
                            class="pack-level-btn"
                            :class="{
                                active:
                                    selectedPackIndex === pIndex &&
                                    selectedLevelIndex === lIndex,
                                error: !level[0]
                            }"
                            @click="selectLevel(pIndex, lIndex)"
                        >
                            {{ level[0]?.level.name || \`Error (\${level[1]}.json)\` }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="level-container">
                <div
                    class="level"
                    v-if="selectedLevel"
                >
                    <h1>{{ selectedLevel.level.name }}</h1>

                    <LevelAuthors
                        :author="selectedLevel.level.author"
                        :creators="selectedLevel.level.creators"
                        :verifier="selectedLevel.level.verifier"
                    />

                    <div style="display:flex; gap:0.5rem;">
                        <div
                            v-for="pack in selectedLevel.level.packs"
                            class="tag"
                            :style="{ background: pack.colour, color: getFontColour(pack.colour) }"
                        >
                            {{ pack.name }}
                        </div>
                    </div>

                    <div v-if="selectedLevel.level.showcase" class="tabs">
                        <button
                            class="tab"
                            :class="{ selected: !toggledShowcase }"
                            @click="toggledShowcase = false"
                        >
                            Verification
                        </button>
                        <button
                            class="tab"
                            :class="{ selected: toggledShowcase }"
                            @click="toggledShowcase = true"
                        >
                            Showcase
                        </button>
                    </div>

                    <iframe class="video" :src="video" frameborder="0"></iframe>

                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Lygio ID</div>
                            <p>{{ selectedLevel.level.id }}</p>
                        </li>
                    </ul>

                    <h2>Rekordai</h2>
                    <table class="records">
                        <tr
                            v-for="record in selectedLevel.records"
                            class="record"
                        >
                            <td class="enjoyment"><p>100%</p></td>
                            <td class="user">
                                <a :href="record.link" target="_blank">
                                    {{ record.user }}
                                </a>
                            </td>
                            <td class="mobile">
                                <img
                                    v-if="record.mobile"
                                    :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`"
                                />
                            </td>
                        </tr>
                    </table>
                </div>

                <div
                    v-else
                    class="level"
                    style="height:100%; justify-content:center; align-items:center;"
                >
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-if="errors.length">
                        <p
                            class="error"
                            v-for="error in errors"
                        >
                            {{ error }}
                        </p>
                    </div>

                    <h3>Apie pakelius</h3>
                    <p>...</p>
                </div>
            </div>
        </main>
    `,

    data: () => ({
        store,
        packs: [],
        packLevels: {},
        selectedPackIndex: 0,
        selectedLevelIndex: 0,
        errors: [],
        loading: true,
        toggledShowcase: false,
    }),

    computed: {
        selectedPack() {
            return this.packs[this.selectedPackIndex];
        },
        selectedLevel() {
            return this.packLevels[this.selectedPack?.name]?.[
                this.selectedLevelIndex
            ]?.[0];
        },
        video() {
            if (!this.selectedLevel?.level.showcase) {
                return embed(this.selectedLevel.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.selectedLevel.level.showcase
                    : this.selectedLevel.level.verification
            );
        },
    },

    async mounted() {
        this.packs = await fetchPacks();

        for (const pack of this.packs) {
            this.packLevels[pack.name] = await fetchPackLevels(pack.name);

            this.errors.push(
                ...this.packLevels[pack.name]
                    .filter(([_, err]) => err)
                    .map(([_, err]) => `Nepavyko pakrauti lygio. (${err}.json)`)
            );
        }

        this.loading = false;
    },

    methods: {
        selectLevel(packIndex, levelIndex) {
            this.selectedPackIndex = packIndex;
            this.selectedLevelIndex = levelIndex;
            this.toggledShowcase = false;
        },
        score,
        embed,
        getFontColour,
    },
};
