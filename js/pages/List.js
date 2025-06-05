import { store } from "../main.js";
import { embed, getFontColour } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};



export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <!--Left side, Level List-->
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list">
                        <td class="rank">
                            <p v-if="i + 1 <= 75" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>

            <!--Middle, Level info-->
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Taškų vertė</div>
                            <p>{{ score(selected + 1, 100, level.enjoymentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Lygio ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                         <li>
                            <div class="type-title-sm">Enjoyment</div>
                            <p class="enjoyment" :src="video"></p>
                        </li>
                    </ul>
                    <div class="nong" v-if="level.NONG != undefined">
                        <a :href="level.NONG">
                            <button><span class="type-label-lg">Atsisiųsti dainą</button>
                        </a>
                    </div>
                    <h2>Rekordai</h2>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}</p>
                            </td>
                            <td class="enjoyment">
                                <p>{{ record.enjoyment }}</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>eina na... (ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>

            <!--Right side, List rules and information-->
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Puslapio layout pasiskolintas iš <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h4>Listo moderatoriai:</h4>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h4>Completion'ų submittinimo taisyklės:</h4>
                    <p>
                        Completion'as turi būti nufilmuotas ir su aiškiai girdimais clickais.
                    </p>
                    <p>
                        Turi būti matoma mirtis prieš completion'o attempt'ą. (jei sugebėjai įveikt per vieną attempt'ą po practice arba iškart
              įeinant į lygį, turi parodyt ir tai)
                    </p>
                    <p>
                        Po lygio įveikimo turi būti matomas "Level Complete" tekstas.
                    </p>
                    <p>
                        Lygius pereikite kaip skirta. Jei skip/bug praleidžią didelę dalį lygio jūsų įveikimo tikrai nepriimsime. Jei challenge esmė yra prastas matomumas ar kažkas panašaus, hack'ai "No Camera Zoom", "No Camera Move", "No Particles" ir "No Shaders" nėra leidžiami.
                    </p>
                    <h4>Challenge'ų submittinimo taisyklės:</h4>
                    <p>
                        Challenge negali būti layout. Turi būti kažkiek dekoruotas, normaliai sustruktūruotas ir būt bent šiek
              tiek visually appealing. OBJEKTŲ SPAM =/= DEKORACIJA, nebent ji padaryta tinkamai (pavyzdžiui Slick Challenge
              series, Say Gex). Default layout blokus naudot galima, bet tada turi būti labai geros ir pilnai užpildytos
              struktūros, ir/arba normalesnė fono dekoracija. Ar jūsų lygio dekoracija gerai atrodo nusprendžia list
              modai.
                    </p>
                    <p>
                        Challenge turi būti visiškai originalus.
                    </p>
                    <p>
                        Patvirtinimai turi būti keliami į YouTube. Ar viešas ar neįtrauktas į sąrašą, jau jūsų sprendimas.
                    </p>
                    <p>
                        Jei lygis gauna update'ą ir jis labai mažai pakeičia arba išvis nekeičia sunkumo,
              patvirtinti arba pereiti iš naujo nebūtina.
                    </p>
                    <p>
                        Challenge turi būti pilnai lietuviškas - gameplay sukurtas lietuvio, dekoracija sukurta lietuvio. Tačiau
              patvirtinimas gali būti ne lietuvio.
                    </p>
                    <p>
                        Naudok bendrą išprusimą ir neieškok spragų taisyklėse.
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        enjoyment(){
            ratingSum = 0;
            ratingCount = 0;
            this.list[this.selected][0].map((record) => {
                if(record.enjoyment != null && record.enjoyment >= 0){
                    ratingSum = ratingSum + record.enjoyment;
                    ratingCount++;

                }
            }) 
           return ratingSum/ratingCount;
        }
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Nepavyko pakrauti listo. Arba bandykite vėliau arba parašykit listo moderatoriam.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Nepavyko pakrauti lygio. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Nepavyko pakrauti listo moderatorių.");
            }
        }

        this.loading = false;
    },
    
    methods: {
        embed,
        score,
    },
};
