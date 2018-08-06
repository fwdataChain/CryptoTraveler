import { CoreUI } from "./CoreUI";

const { ccclass, property } = cc._decorator;

declare var Neb: any;
declare var NebPay: any;
declare var Account: any;
declare var HttpRequest: any;
export const ContractAddress = 'n1vMo7fEcQ18gLDAq8GutcgoyXUyEGDFtQm';
export const EncKey = 37234;

@ccclass
export class MainCtrl extends cc.Component {
    static Instance: MainCtrl;

    static BlockchainUrl: string;
    wallet_address: string;

    BTCHistory: object[] = null;

    lastScore = 0;
    lastPrice = 0;
    lastTradeHistory = [];

    @property(cc.Node)
    UIContainer: cc.Node = null;
    @property(cc.Node)
    HomeUI: cc.Node = null;
    @property(cc.Node)
    CoreUI: cc.Node = null;
    @property(cc.Node)
    ResultUI: cc.Node = null;
    @property(cc.Node)
    LeaderboardUI: cc.Node = null;
    @property(cc.Node)
    UploadUI: cc.Node = null;

    onLoad() {
        MainCtrl.Instance = this;
        document.title = "NAS|币圈穿越记";

        MainCtrl.BlockchainUrl = 'https://mainnet.nebulas.io'; // 'https://testnet.nebulas.io'; //NebPay.config.testnetUrl;这个好像不对啊 //NebPay.config.mainnetUrl
        console.log('BlockchainUrl', MainCtrl.BlockchainUrl);

        //加载历史价格数据
        cc.loader.loadRes('BTC', function (err, txt) {
            console.log('BTCHistory loaded');
            this.BTCHistory = txt;
            this.fetchLatestData();
        }.bind(this));

    }

    start() {

        this.UIContainer.children.forEach((c) => {
            c.active = false;
        });
        this.HomeUI.active = true;

        let as = this.node.getChildByName('AudioSource').getComponent(cc.AudioSource);
        setTimeout(() => { as.play(); }, 1000);
        // cc.loader.load(cc.url.raw('resources/bgm.mp3'), function(){

        // });
    }

    nebState;
    checkWallet() {
        try {
            let self = this;
            let neb = new Neb();
            neb.setRequest(new HttpRequest(MainCtrl.BlockchainUrl));
            neb.api.getNebState().then(function (state) {
                self.nebState = state;

                window.addEventListener('message', self.getMessage);

                window.postMessage({
                    "target": "contentscript",
                    "data": {},
                    "method": "getAccount",
                }, "*");
            });
        } catch (error) {
            console.error(error);
        }
    }

    getMessage(e) {
        if (e.data && e.data.data) {
            if (e.data.data.account) {
                var address = e.data.data.account;
                MainCtrl.Instance.wallet_address = address;
            }
        }

    }

    OnBtnStartClick() {
        this.UIContainer.children.forEach((c) => {
            c.active = false;
        });
        this.CoreUI.active = true;
        this.CoreUI.getComponent(CoreUI).restart();
    }

    GotoResult() {
        this.UIContainer.children.forEach((c) => {
            c.active = false;
        });
        this.ResultUI.active = true;
    }
    GotoLeaderboard() {
        this.UIContainer.children.forEach((c) => {
            c.active = false;
        });
        this.LeaderboardUI.active = true;
    }
    GotoDonate() {
        this.lastScore = 0;
        this.UIContainer.children.forEach((c) => {
            c.active = false;
        });
        this.UploadUI.active = true;
    }
    GotoUpload() {
        this.UIContainer.children.forEach((c) => {
            c.active = false;
        });
        this.UploadUI.active = true;
    }
    GotoHome() {
        this.UIContainer.children.forEach((c) => {
            c.active = false;
        });
        this.HomeUI.active = true;
    }

    fetchLatestData() {
        var xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
                let response = JSON.parse(xhr.responseText);
                console.log('fetchLatestData', response);
                let latestHistory = response.Data;
                for (let i = 0; i < latestHistory.length; i++) {
                    let date = new Date(latestHistory[i].time * 1000);
                    let dateString = `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
                    MainCtrl.Instance.BTCHistory.push({ date: dateString, close: latestHistory[i].close });
                }
            }
        }
        let history = MainCtrl.Instance.BTCHistory;
        let now = new Date();
        let lastDay = new Date(history[history.length - 1].date);
        let moreDays = ((now - lastDay) / 86400000 - 1).toFixed();
        console.log(Number(lastDay), 'md', moreDays);
        xhr.open('GET', `https://min-api.cryptocompare.com/data/histoday?fsym=BTC&tsym=USD&limit=${moreDays}&aggregate=1&e=CCCAGG`, true);
        xhr.send();
    }
}