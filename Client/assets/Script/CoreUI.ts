import { MainCtrl } from "./MainCtrl";
import BalanceFormatter from "./BalanceFormatter";
import MoneyLabel from "./MoneyLabel";

const { ccclass, property } = cc._decorator;

@ccclass
export class CoreUI extends cc.Component {

    fiatBalance: number = 0;
    btcBalance: number = 0;
    static readonly USD2CNY = 6.3;

    t: number = 0;
    isRunning = false;
    interval: number = 1;
    nextDayCountdown: number = 1e8;
    currentSpeeder: number = 0;
    speedMods: number[] = [1, 5, 20, 100, 500];
    speedersButton: boolean[] = [false, false, false, false, false];
    speedersKeyboard: boolean[] = [false, false, false, false, false];

    dayWidth = 5;
    width = 880;//必须是dayWidth整数倍
    height = 468;

    @property(cc.Label)
    lblPrice: cc.Label = null;
    @property(cc.Label)
    lblDate: cc.Label = null;
    @property(cc.Node)
    grpNews: cc.Node = null;
    @property(cc.Label)
    lblNews: cc.Label = null;
    @property(MoneyLabel)
    lblFiatBalance: MoneyLabel = null;
    @property(MoneyLabel)
    lblBtcBalance: MoneyLabel = null;
    @property(cc.Label)
    lblTotalAsCNY: cc.Label = null;
    @property(cc.Label)
    lblTotalAsBTC: cc.Label = null;
    @property(cc.Graphics)
    graphics: cc.Graphics = null;
    @property(cc.Node)
    lastOper: cc.Node = null;
    @property(cc.Label)
    lblLastOper: cc.Label = null;
    @property(cc.Node)
    highestLine: cc.Node = null;
    @property(cc.Node)
    currentPriceLine: cc.Node = null;
    @property(cc.Label)
    lblCurrentPrice: cc.Label = null;
    @property(cc.Button)
    btnBuyAll: cc.Button = null;
    @property(cc.Button)
    btnSellAll: cc.Button = null;

    @property(cc.Label)
    lblSpeed: cc.Label = null;
    @property([cc.Button])
    btnSpeeds: Array<cc.Button> = [];

    lastOperT: number = null; //第几天
    lastOperDir: number = null; //1买   2卖
    lastOperPrice: number = null;
    historicalHighestPrice: number;

    onLoad() {
        let self = this;
        this.lblFiatBalance.formatterFunc = (n: number) => BalanceFormatter.formatCNY(n) + 'CNY';
        this.lblBtcBalance.formatterFunc = (n: number) => BalanceFormatter.formatBTC(n) + 'BTC';

        for (let i = 0; i < this.btnSpeeds.length; i++) {
            const btnSpeed = this.btnSpeeds[i];
            btnSpeed.node.on(cc.Node.EventType.TOUCH_START, function (event) {
                self.speedersButton[i] = true;
                self.currentSpeeder = i;
            });
            btnSpeed.node.on(cc.Node.EventType.TOUCH_END, function (event) {
                self.speedersButton[i] = false;
            });

            // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, function (event) {
            //     console.log("keyCode", event.keyCode)
            //     switch (event.keyCode) {
            //         case cc.KEY[1]:
            //             self.speedersKeyboard[0] = true;
            //             self.currentSpeeder = 0;
            //             break;
            //         case cc.KEY[2]:
            //             self.speedersKeyboard[1] = true;
            //             self.currentSpeeder = 1;
            //             break;
            //         case cc.KEY[3]:
            //             self.speedersKeyboard[2] = true;
            //             self.currentSpeeder = 2;
            //             break;
            //         case cc.KEY[4]:
            //             self.speedersKeyboard[3] = true;
            //             self.currentSpeeder = 3;
            //             break;
            //         case cc.KEY[5]:
            //             self.speedersKeyboard[4] = true;
            //             self.currentSpeeder = 4;
            //             break;
            //     }
            // });
            // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, function (event) {
            //     switch (event.keyCode) {
            //         case cc.KEY[1]:
            //             self.speedersKeyboard[0] = false;
            //             break;
            //         case cc.KEY[2]:
            //             self.speedersKeyboard[1] = false;
            //             break;
            //         case cc.KEY[3]:
            //             self.speedersKeyboard[2] = false;
            //             break;
            //         case cc.KEY[4]:
            //             self.speedersKeyboard[3] = false;
            //             break;
            //         case cc.KEY[5]:
            //             self.speedersKeyboard[4] = false;
            //             break;
            //     }
            // });
        }
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, function (event) {
            switch (event.keyCode) {
                case cc.KEY.j:
                    self.BuyAll();
                    break;
                case cc.KEY.k:
                    self.SellAll();
                    break;
            }
        });
    }

    restart() {
        this.fiatBalance = 100 / CoreUI.USD2CNY;
        this.btcBalance = 0;
        this.t = -1;
        this.nextDayCountdown = 0;
        this.historicalHighestPrice = 0.1;
        this.graphics.moveTo(0, 0);
        this.lastOper.active = false;
        this.lastOperT = null;
        this.lastOperDir = null;
        this.lastOperPrice = null;
        this.highestLine.position = new cc.Vec2(0, 0);
        this.currentSpeeder = 0;
        MainCtrl.Instance.lastTradeHistory = [];
        this.isRunning = true;
        this.refreshBalance();
    }

    BuyAll() {
        console.log("全仓买入");
        let data = MainCtrl.Instance.BTCHistory;
        let price = data[this.t]['close'];
        let amountOfBTC = Math.min(20000000 - this.btcBalance, this.fiatBalance / price);
        if (this.fiatBalance < this.btcBalance * price * 0.00001) return;
        this.btcBalance += amountOfBTC;
        this.fiatBalance -= amountOfBTC * price;
        this.lastOperT = this.t;
        this.lastOperDir = 1;
        this.lastOperPrice = price;
        MainCtrl.Instance.lastTradeHistory.push([this.t, price, 1, amountOfBTC]);
        this.refreshBalance();
    }
    SellAll() {
        console.log("全仓卖出");
        let data = MainCtrl.Instance.BTCHistory;
        let price = data[this.t]['close'];
        let amountOfBTC = this.btcBalance;
        if (amountOfBTC < this.fiatBalance / price * 0.00001) return;
        this.fiatBalance += amountOfBTC * price;
        this.btcBalance -= amountOfBTC;
        this.lastOperT = this.t;
        this.lastOperDir = 2;
        this.lastOperPrice = price;
        MainCtrl.Instance.lastTradeHistory.push([this.t, price, 2, amountOfBTC]);
        this.refreshBalance();
    }

    update(dt: number) {
        let data = MainCtrl.Instance.BTCHistory;
        if (this.t >= (data as Array<any>).length - 1) return;
        let speedMod = 1;
        // for (let i = 0; i < this.speedersButton.length; i++) {
        //     if (this.speedersButton[i] || this.speedersKeyboard[i]) {
        //         speedMod *= this.speedMods[i];
        //     }
        // }
        this.lblSpeed.string = (speedMod * this.speedMods[this.currentSpeeder] / this.interval).toFixed();
        for (let i = 0; i < this.btnSpeeds.length; i++) {
            const btn = this.btnSpeeds[i];
            btn.interactable = (i != this.currentSpeeder);
        }
        this.nextDayCountdown -= dt * speedMod * this.speedMods[this.currentSpeeder];
        while (this.nextDayCountdown <= 0 && this.t < (data as Array<any>).length - 1) {
            this.t++;
            // console.log("t", this.t);
            this.nextDayCountdown += this.interval;
            let price = data[this.t]['close'];
            if (price > this.historicalHighestPrice) {
                this.historicalHighestPrice = price;
            }
            let news: string = data[this.t]['news'];
            if (news && news.length > 0) {
                this.popupNews(news);
            }
        }

        if (this.t < 0) return;

        let price = data[this.t]['close'];

        {
            this.graphics.clear();

            //Axes
            // this.graphics.moveTo(0, 0);
            // this.graphics.lineTo(this.width, 0);

            //Line Chart
            let factor = this.height * 0.96 / this.historicalHighestPrice;
            let earliestT = Math.max(0, this.t - Math.round(this.width / this.dayWidth));
            this.graphics.moveTo(0, data[earliestT]['close'] * factor);
            for (let i = earliestT + 1; i <= this.t; i++) {
                this.graphics.lineTo((i - earliestT) * this.dayWidth, data[i]['close'] * factor);
            }

            this.graphics.stroke();

            if (this.lastOperDir) {
                this.lastOper.position = new cc.Vec2(Math.max(0, this.lastOperT - earliestT) * this.dayWidth, this.lastOperPrice * factor);
                this.lblLastOper.string = this.lastOperDir == 1 ? '最近买入' : '最近卖出';
                this.lastOper.active = true;
            } else {
                this.lastOper.active = false;
            }

            this.highestLine.position = new cc.Vec2(0, this.historicalHighestPrice * factor);
            this.lblCurrentPrice.string = "￥" + BalanceFormatter.formatCNY(price * CoreUI.USD2CNY);
            this.currentPriceLine.position = new cc.Vec2(Math.min(this.width, this.t - earliestT) * this.dayWidth, price * factor);
        }


        this.lblPrice.string = "￥" + BalanceFormatter.formatCNY(price * CoreUI.USD2CNY);
        this.lblDate.string = data[this.t]['date'];

        let totalAsBtc = this.fiatBalance / price + this.btcBalance;
        this.lblTotalAsCNY.string = BalanceFormatter.formatCNY(totalAsBtc * price * CoreUI.USD2CNY);
        this.lblTotalAsBTC.string = '=' + BalanceFormatter.formatBTC(totalAsBtc);

        if (this.isRunning && this.t >= (data as Array<any>).length - 1) {
            MainCtrl.Instance.lastScore = totalAsBtc;
            MainCtrl.Instance.lastPrice = price;
            console.log("End");
            setTimeout(() => {
                MainCtrl.Instance.GotoResult();
            }, 1000);
            this.isRunning = false;
        }

        this.btnBuyAll.interactable = this.isRunning && this.fiatBalance > 0.01;
        this.btnSellAll.interactable = this.isRunning && this.btcBalance > 0.00001;

        this.newsOpacity = Math.max(0, this.newsOpacity - 1 * dt);
        this.grpNews.opacity = Math.min(1, this.newsOpacity) * 255;
    }

    refreshBalance() {
        this.lblFiatBalance.setTargetNumber(Math.max(0, this.fiatBalance) * CoreUI.USD2CNY);
        this.lblBtcBalance.setTargetNumber(Math.max(0, this.btcBalance));
    }

    newsOpacity = 0;
    popupNews(news: string) {
        this.lblNews.string = news;
        this.newsOpacity = 4.5;
    }
}