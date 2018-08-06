import { MainCtrl } from "./MainCtrl";
import BalanceFormatter from "./BalanceFormatter";
import { CoreUI } from "./CoreUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ResultUI extends cc.Component {

    @property(cc.Label)
    lblTotalBTC: cc.Label = null;
    @property(cc.Label)
    lblTotalCNY: cc.Label = null;
    @property(cc.Label)
    lblTitle: cc.Label = null;

    @property(cc.Node)
    tradeTemplate: cc.Node = null;
    @property(cc.Node)
    tradeContainer: cc.Node = null;

    trades = [];

    intervals = [0.25, 2, 2, 2, 2, 2, 2, 2, 2];

    onEnable() {
        let btc = MainCtrl.Instance.lastScore;
        this.lblTotalBTC.string = BalanceFormatter.formatBTC(btc);
        this.lblTotalCNY.string = "=￥" + BalanceFormatter.formatCNY(btc * MainCtrl.Instance.lastPrice * CoreUI.USD2CNY);

        let children = this.node.children;
        let actions = [];
        let delay = 0;
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            node.opacity = 0;
            delay += i < this.intervals.length ? this.intervals[i] : 0;
            let seq = cc.sequence(cc.delayTime(delay), cc.fadeIn(0.5));
            node.runAction(seq);
        }

        let history = MainCtrl.Instance.lastTradeHistory;

        const btcHistory = MainCtrl.Instance.BTCHistory;
        this.lblTitle.string = this.calcTitle(btc, btcHistory[btcHistory.length - 1].close, history);

        const maxShowCount = 20;
        if (history.length > maxShowCount) {
            history.splice(5, history.length - maxShowCount, `......(省略${history.length - maxShowCount}条记录)`);
        }
        for (let i = 0; i < history.length; i++) {
            const tradeInfo = history[i];
            let tradeNode = cc.instantiate(this.tradeTemplate);
            tradeNode.parent = this.tradeContainer;
            if (typeof (tradeInfo) != 'string') {
                tradeNode.getChildByName('LblDate').getComponent(cc.Label).string = btcHistory[tradeInfo[0]].date;
                tradeNode.getChildByName('LblPrice').getComponent(cc.Label).string = '￥' + BalanceFormatter.formatCNY(tradeInfo[1]*CoreUI.USD2CNY);
                tradeNode.getChildByName('LblDirection').getComponent(cc.Label).string = tradeInfo[2] == 1 ? '买' : '卖';
                tradeNode.getChildByName('LblAmount').getComponent(cc.Label).string = BalanceFormatter.formatBTC(tradeInfo[3]) + 'BTC';
            } else {
                tradeNode.getChildByName('LblDate').getComponent(cc.Label).string = tradeInfo;
                tradeNode.getChildByName('LblPrice').getComponent(cc.Label).string = '';
                tradeNode.getChildByName('LblDirection').getComponent(cc.Label).string = '';
                tradeNode.getChildByName('LblAmount').getComponent(cc.Label).string = '';
            }
            tradeNode.active = true;
        }
        this.tradeTemplate.active = false;

        MainCtrl.Instance.checkWallet();
    }

    calcTitle(finalBTC: number, finalPrice: number, tradeHistory: Object[]) {
        let lastTrade = tradeHistory[tradeHistory.length - 1];
        if (tradeHistory.length == 0) {
            return '时间线守护者';
        }
        if (this.isTakongDog(finalBTC, finalPrice, tradeHistory)) {
            return '踏空狗';
        }
        if (finalBTC * finalPrice * CoreUI.USD2CNY < 100) {
            return '归零膏';
        }
        if (tradeHistory[0][3] * 0.7 > finalBTC && tradeHistory.length < 15) {
            return '追涨杀跌的韭菜';
        }
        if (tradeHistory[0][3] * 0.7 > finalBTC && tradeHistory.length >= 15) {
            return '神操作韭菜';
        }
        if (tradeHistory.length < 4 && finalBTC > 200) {
            return '价值投资者';
        }
        if (tradeHistory.length == 1 && finalBTC > 10) {
            return '比特币信徒';
        }
        if (tradeHistory.length == 0) {
            return '被时代抛弃的人';
        }
        if (this.isBuoduanPrince(finalBTC, finalPrice, tradeHistory)) {
            return '波段小王子';
        }
        if (this.isGouzhuang(finalBTC, finalPrice, tradeHistory)) {
            return '狗庄';
        }
        if (tradeHistory[0][0] > 1000) {
            return '后知后觉者';
        }
        if (finalBTC >= 1e7) {
            return '神';
        }
        if (finalBTC >= 1e6) {
            return '中本次郎';
        }
        if (finalBTC >= 1e5) {
            return '先知';
        }
        if (finalBTC >= 1e4) {
            return '神级操盘手';
        }
        if (finalBTC > tradeHistory[0][3] * 1.1) {
            return '操盘手';
        }
        if (finalBTC >= 1e1) {
            return '高级韭菜';
        }
        return '韭菜';
    }
    isTakongDog(finalBTC: number, finalPrice: number, tradeHistory: Object[]): boolean {
        if (finalBTC < 300 && tradeHistory.length < 8) {
            for (let i = 1; i < tradeHistory.length; i++) {
                const trade = tradeHistory[i];
                const previousTrade = tradeHistory[i - 1];
                if (previousTrade[2] == 2 && trade[2] == 1 && previousTrade[1] * 5 <= trade[1]) {
                    return true;
                }
            }
        }
    }
    isBuoduanPrince(finalBTC: number, finalPrice: number, tradeHistory: Object[]): boolean {
        let succCount, failCount;
        for (let i = 1; i < tradeHistory.length; i++) {
            const trade = tradeHistory[i];
            const previousTrade = tradeHistory[i - 1];
            if (previousTrade[2] == 1 && trade[2] == 2 && previousTrade[1] < trade[1]) {
                succCount++;
            } else if (previousTrade[2] == 2 && trade[2] == 1 && previousTrade[1] > trade[1]) {
                succCount++;
            } else {
                failCount++;
            }
        }
        if (succCount >= (tradeHistory.length - 1) * 0.8) {
            return true;
        }
        return false;
    }
    isGouzhuang(finalBTC: number, finalPrice: number, tradeHistory: Object[]): boolean {
        let succCount, failCount;
        if (finalBTC > 1000) {
            for (let i = 1; i < tradeHistory.length; i++) {
                const trade = tradeHistory[i];
                const previousTrade = tradeHistory[i - 1];
                if (previousTrade[2] == 1 && trade[2] == 2) {
                    if (previousTrade[1] < trade[1]
                        && trade[0] - previousTrade[0] < 100) {
                        succCount++;
                    } else {
                        failCount++;
                    }
                }
            }
            if (succCount > (succCount + failCount) * 0.7) {
                return true;
            }
        }
        return false;
    }
}
