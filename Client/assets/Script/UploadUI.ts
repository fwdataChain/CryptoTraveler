import { MainCtrl, ContractAddress, EncKey } from "./MainCtrl";
import BalanceFormatter from "./BalanceFormatter";

const { ccclass, property } = cc._decorator;


@ccclass
export default class UploadUI extends cc.Component {

    @property(cc.Label)
    lblTotalBTC: cc.Label = null;
    @property(cc.EditBox)
    edtComment: cc.EditBox = null;
    @property(cc.EditBox)
    edtDonate: cc.EditBox = null;

    @property(cc.Node)
    grpWithScore: cc.Node = null;
    @property(cc.Node)
    grpNoScore: cc.Node = null;

    @property(cc.Label)
    lblSend: cc.Label = null;

    onEnable() {
        let btc = MainCtrl.Instance.lastScore;
        if (btc) {
            this.lblTotalBTC.string = BalanceFormatter.formatBTC(btc);
            this.grpWithScore.active = true;
            this.grpNoScore.active = false;
            this.lblSend.string = '上传到时间机器';
        } else {
            this.grpWithScore.active = false;
            this.grpNoScore.active = true;
            this.lblSend.string = '发送捐赠';
        }
    }

    onBackBtnClick() {
        if (MainCtrl.Instance.lastScore > 0.00000001) {
            MainCtrl.Instance.GotoResult();
        } else {
            MainCtrl.Instance.GotoHome();
        }
    }

    onUploadBtnClick() {
        if (window.webExtensionWallet) {
            try {
                let score = MainCtrl.Instance.lastScore;
                let donateAmount = parseFloat(this.edtDonate.string);
                let comment = this.edtComment.string;
                let operation = [];
                MainCtrl.Instance.lastTradeHistory.forEach(trade => {
                    operation.push(trade[0] * 10 + trade[2]);
                });

                var nebPay = new NebPay();
                var serialNumber;
                var callbackUrl = MainCtrl.BlockchainUrl;

                var to = ContractAddress;
                var value = donateAmount;
                var callFunction = 'submit';
                let encScore = UploadUI.encrypto(score.toString(), EncKey, 25);
                console.log("调用钱包", score, donateAmount, comment, operation, encScore);
                var callArgs = '["' + encScore + '","' + comment + '",[' + operation.toString() + ']]';
                serialNumber = nebPay.call(to, value, callFunction, callArgs, {
                    qrcode: {
                        showQRCode: false
                    },
                    goods: {
                        name: "test",
                        desc: "test goods"
                    },
                    callback: callbackUrl,
                    listener: this.listener
                });
            } catch (error) {
                console.error(error);
            }
        } else {
            window.open("https://github.com/ChengOrangeJu/WebExtensionWallet");
        }
    }

    listener(resp: string) {
        console.log("submit resp: ", resp);
        if (resp.toString().substr(0, 5) != 'Error') {
            MainCtrl.Instance.GotoHome();
        }
    }

    static encrypto(str, xor, hex) {
        if (typeof str !== 'string' || typeof xor !== 'number' || typeof hex !== 'number') {
            return;
        }

        let resultList = [];
        hex = hex <= 25 ? hex : hex % 25;

        for (let i = 0; i < str.length; i++) {
            // 提取字符串每个字符的ascll码
            let charCode: any = str.charCodeAt(i);
            // 进行异或加密
            charCode = (charCode * 1) ^ xor;
            // 异或加密后的字符转成 hex 位数的字符串
            charCode = charCode.toString(hex);
            resultList.push(charCode);
        }

        let splitStr = String.fromCharCode(hex + 97);
        let resultStr = resultList.join(splitStr);
        return resultStr;
    }
}
