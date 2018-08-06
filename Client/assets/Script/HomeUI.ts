import { MainCtrl } from "./MainCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HomeUI extends cc.Component {

    @property(cc.Button)
    btnDonate: cc.Button = null;
    @property(cc.Button)
    btnInstallWallet: cc.Button = null;

    onLoad() {
    }

    onEnable() {
        MainCtrl.Instance.checkWallet();
    }

    onInstallWalletBtnClick() {
        window.open("https://github.com/ChengOrangeJu/WebExtensionWallet");
    }

    update() {
        
    }

    onEnglishBtnClick() {
        window.open("https://fairwood.github.io/CoinTraveler/en/");
    }
}