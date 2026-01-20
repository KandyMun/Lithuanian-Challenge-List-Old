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
            <div class="packs-nav">
                <div>
                    <button @click="switchLevels(i)" v-for="(pack, i) in packs" :style="{background: pack.colour}" class="type-label-lg">
                        <p>{{pack.name}}</p>
                    </button>
                </div>
            </div>
            <div class="list-container">
                <table class="list" v-if="selectedPackLevels">
                    <tr v-for="(level, i) in selectedPackLevels">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ 'active': selectedLevel == i, 'error': !level[0] }">
                            <button :style="[selectedLevel == i ? {background: 'white'} : {}]" @click="selectedLevel = i">
                                <span class="type-label-lg">{{ level[0]?.level.name || \`Error (\${level[1]}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="selectedPackLevels[selectedLevel][0]">
                    <h1>{{ selectedPackLevels[selectedLevel][0].level.name }}</h1>
                    <LevelAuthors :author="selectedPackLevels[selectedLevel][0].level.author" :creators="selectedPackLevels[selectedLevel][0].level.creators" :verifier="selectedPackLevels[selectedLevel][0].level.verifier"></LevelAuthors>
                    <div class="packs">
                        <div v-for="pack in selectedPackLevels[selectedLevel][0].level.packs" class="tag" :style="{background:pack.colour, color:getFontColour(pack.colour)}">
                            {{pack.name}}
                        </div>
                    </div>
                    <div v-if="selectedPackLevels[selectedLevel][0].level.showcase" class="tabs">
                        <button class="tab type-label-lg" :class="{selected: !toggledShowcase}" @click="toggledShowcase = false">
                            <span class="type-label-lg">Verification</span>
                        </button>
                        <button class="tab" :class="{selected: toggledShowcase}" @click="toggledShowcase = true">
                            <span class="type-label-lg">Showcase</span>
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
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <p> Pakelių funkciją sukurė KrisGra. </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        store,
        packs: [],
        errors: [],
        selected: 0,
        selectedLevel: 0,
        selectedPackLevels: [],
        loading: true,
        loadingPack: true,
        toggledShowcase: false,
    }),
    computed: {
        pack() {
            return this.packs[this.selected];
        },
        video() {
            if (!this.selectedPackLevels[this.selectedLevel][0].level.showcase) {
                return embed(this.selectedPackLevels[this.selectedLevel][0].level.verification);
            }
            return embed(this.toggledShowcase
                ? this.selectedPackLevels[this.selectedLevel][0].level.showcase
                : this.selectedPackLevels[this.selectedLevel][0].level.verification
            );
        },
    },
    async mounted() {
        // Inject packs.css dynamically
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/pages/packs.css";
        document.head.appendChild(link);

        // Fetch packs
        this.packs = await fetchPacks();

        // Inject PAKELIAI title
        const title = document.createElement("h1");
        title.className = "pack-title";
        title.textContent = "PAKELIAI";
        document.querySelector("main").prepend(title);

        this.selectedPackLevels = await fetchPackLevels(this.packs[this.selected].name);

        // Error handling
        if (!this.packs) {
            this.errors = [
                "Nepavyko pakrauti sąrašo. Pabandykite po kelių minučių arba praneškite sąrašo moderatoriams.",
            ];
        } else {
            this.errors.push(
                ...this.selectedPackLevels
                    .filter(([_, err]) => err)
                    .map(([_, err]) => `Nepavyko pakrauti lygio. (${err}.json)`)
            );
        }

        this.loading = false;
        this.loadingPack = false;
    },
    methods: {
        async switchLevels(i) {
            this.loadingPack = true;
            this.selected = i;
            this.selectedLevel = 0;
            this.selectedPackLevels = await fetchPackLevels(this.packs[this.selected].name);

            this.errors.length = 0;
            if (!this.packs) {
                this.errors = ["Nepavyko pakrauti sąrašo. Pabandykite po kelių minučių arba praneškite sąrašo moderatoriams."];
            } else {
                this.errors.push(
                    ...this.selectedPackLevels
                        .filter(([_, err]) => err)
                        .map(([_, err]) => `Nepavyko pakrauti lygio. (${err}.json)`)
                );
            }
            this.loadingPack = false;
        },
        score,
        embed,
        getFontColour,
    },
};
