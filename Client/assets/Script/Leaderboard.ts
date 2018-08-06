import BalanceFormatter from "./BalanceFormatter";
import { ContractAddress, MainCtrl } from "./MainCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Leaderboard extends cc.Component {

    static readonly ElementCount = 20;

    @property(cc.Node)
    template: cc.Node = null; //同时也是我的
    @property(cc.Node)
    container: cc.Node = null;

    elements: cc.Node[] = [];

    tab = 'score';

    static scoreBoard = [{ address: '正在获取数据，请稍候……', score: 0, donation: 0, comment: '' }];
    static donationBoard = [{ address: '正在获取数据，请稍候……', score: 0, donation: 0, comment: '' }];

    onLoad() {
        this.setAndRefreshElement('*', this.template, null);
        for (let i = 0; i < Leaderboard.ElementCount; i++) {
            let element = cc.instantiate(this.template);
            this.elements[i] = element;
            element.parent = this.container;
            element.name = i.toFixed();
            this.setAndRefreshElement(i + 1, element, null);
        }
    }

    onEnable() {
        try {
            this.fetchData();
            this.switchTab(null, 'score');
        } catch (e) {
            console.error(e);
        }
    }

    fetchData() {
        let self = this;
        if (!Neb) return;
        let neb = new Neb();
        neb.setRequest(new HttpRequest(MainCtrl.BlockchainUrl));

        var from = MainCtrl.Instance.wallet_address ? MainCtrl.Instance.wallet_address : Account.NewAccount().getAddressString();
        console.log("from:" + from)

        var value = "0";
        var nonce = "0"
        var gas_price = "1000000"
        var gas_limit = "2000000"
        var callFunction = "get_score_rankboard";
        var contract = {
            "function": callFunction,
            "args": "[]"
        }

        neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(function (resp) {
            console.log('get_score_rankboard', resp)
            Leaderboard.scoreBoard = JSON.parse(resp.result).result_data;
            self.switchTab(null, self.tab);
        }).catch(function (err) {
            console.log("error:" + err.message)
        })

        var callFunction = "get_donation_rankboard";
        var contract = {
            "function": callFunction,
            "args": "[]"
        }
        neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(function (resp) {
            console.log('get_donation_rankboard', resp)
            Leaderboard.donationBoard = JSON.parse(resp.result).result_data;
            self.switchTab(null, self.tab);
        }).catch(function (err) {
            console.log("error:" + err.message)
        })


        var callFunction = "get_player_info";
        var contract = {
            "function": callFunction,
            "args": "[]"
        }
        neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(function (resp) {
            console.log('get_player_info', resp)
            self.setAndRefreshElement('*', self.template, JSON.parse(resp.result).result_data);
        }).catch(function (err) {
            console.log("error:" + err.message)
        })
    }

    setAndRefreshElement(index: number | string, element: cc.Node, data: object) {
        if (data) {
            element.getChildByName('LblRank').getComponent(cc.Label).string = index.toString();
            element.getChildByName('LblAddress').getComponent(cc.Label).string = data.address;
            element.getChildByName('LblScore').getComponent(cc.Label).string = BalanceFormatter.formatBTC(data.score);
            element.getChildByName('LblDonation').getComponent(cc.Label).string = BalanceFormatter.formatNAS(Number(data.donation) / 1e18);
            element.getChildByName('LblComment').getComponent(cc.Label).string = data.comment;
        } else {
            element.getChildByName('LblRank').getComponent(cc.Label).string = index.toString();
            element.getChildByName('LblAddress').getComponent(cc.Label).string = '';
            element.getChildByName('LblScore').getComponent(cc.Label).string = '';
            element.getChildByName('LblDonation').getComponent(cc.Label).string = '';
            element.getChildByName('LblComment').getComponent(cc.Label).string = '';
        }
    }

    switchTab(event, tab) {
        switch (tab) {
            case 'score':
                console.log('tab', tab);
                for (let i = 0; i < this.elements.length; i++) {
                    const element = this.elements[i];
                    this.setAndRefreshElement(i, element, i < Leaderboard.scoreBoard.length ? Leaderboard.scoreBoard[i] : null);
                }
                break;
            case 'donation':
                for (let i = 0; i < this.elements.length; i++) {
                    const element = this.elements[i];
                    this.setAndRefreshElement(i, element, i < Leaderboard.donationBoard.length ? Leaderboard.donationBoard[i] : null);
                }
                break;

            default:
                break;
        }
    }
}
