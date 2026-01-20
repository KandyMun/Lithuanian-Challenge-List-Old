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
            <!-- PAGE TITLE -->
            <div class="packs-title">PAKELIAI</div>

            <!-- PACKS NAV -->
            <div class="packs-nav">
                <div>
                    <button 
                        v-for="(pack, i) in packs" 
                        :key="i"
                        @click="switchLevels(i)" 
                        :style="{background: pack.colour}" 
                        class="type-label-lg"
                    >
                        {{ pack.name }}
                    </button>
                </div>
            </div>

            <!-- LEVEL LIST -->
            <div class="list-container">
                <table class="list" v-if="selectedPackLevels">
                    <tr v-for="(level, i) in selectedPackLevels" :key="i">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ 'active': selectedLevel == i, 'error': !level[0] }">
                            <button :style="[selectedLevel == i ? {background: 'white'}:{}]" @click="selectedLevel = i">
                                <span class="type-label-lg">{{ level[0]?.level.name || \`Error (\${level[1]}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- LEVEL INFO PANEL -->
            <div class="level-container">
                <div class="level" v-if="selectedPackLevels[selectedLevel][0]">
                    <h1>{{ selectedPackLevels[selectedLevel][0].level.name }}</h1>
                    <LevelAuthors 
                        :author="selectedPackLevels[selectedLevel][0].level.author" 
                        :creators="selectedPackLevels[selectedLevel][0].level.creators" 
                        :verifier="selectedPackLevels[selectedLevel][0].level.verifier"
                    ></LevelAuthors>

                    <!-- PACK TAGS -->
                    <div class="packs">
                        <div v-for="pack in selectedPackLevels[selectedLevel][0].level.packs" 
                            class="tag" 
                            :style="{background: pack.colour, color: getFontColour(pack.colour)}">
                            {{ pack.name }}
                        </div>
                    </div>

                    <!-- VIDEO -->
                    <iframe class="video" :src="video" frameborder="0"></iframe>

                    <!-- STATS -->
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Lygio ID</div>
                            <p>{{ selectedPackLevels[selectedLevel][0].level.id }}</p>
                        </li>
                    </ul>

                    <!-- RECORDS -->
                    <h2>Rekordai</h2>
                    <table class="records">
                        <tr v-for="(record, i) in selectedPackLevels[selectedLevel][0].records" :key="i" class="record">
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

                <!-- ERROR PLACEHOLDER -->
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <!-- ERROR MESSAGES -->
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="(error, i) of errors" :key="i">{{ error }}</p>
                    </div>
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
        video() {
            const level = this.selectedPackLevels[this.selectedLevel][0]?.level;
            if (!level) return '';
            if (!level.showcase) return embed(level.verification);
            return embed(this.toggledShowcase ? level.showcase : level.verification);
        },
    },
    async mounted() {
        this.packs = await fetchPacks();
        this.selectedPackLevels = await fetchPackLevels(this.packs[this.selected].name);

        if (!this.packs) {
            this.errors = ["Nepavyko pakrauti sąrašo. Pabandykite po kelių minučių."];
        } else {
            this.errors.push(
                ...this.selectedPackLevels.filter(([_, err]) => err).map(([_, err]) => `Nepavyko pakrauti lygio. (${err}.json)`)
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
                this.errors = ["Nepavyko pakrauti sąrašo. Pabandykite po kelių minučių."];
            } else {
                this.errors.push(
                    ...this.selectedPackLevels.filter(([_, err]) => err).map(([_, err]) => `Nepavyko pakrauti lygio. (${err}.json)`)
                );
            }
            this.loadingPack = false;
        },
        score,
        embed,
        getFontColour,
    },
};
