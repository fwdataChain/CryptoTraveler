const { ccclass, property } = cc._decorator;

@ccclass
export default class MoneyLabel extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    readonly transitionTime = 0.3;

    startNumber = 0;
    targetNumber = 0;
    currentNumber = 0;
    countdown = this.transitionTime;

    formatterFunc: (n: number) => string;

    setTargetNumber(target: number) {
        this.startNumber = this.targetNumber;
        this.targetNumber = target;
        this.countdown = this.transitionTime;
    }

    update(dt: number) {
        if (this.countdown > 0) {
            this.countdown -= dt;
            if (this.countdown > 0) {
                this.currentNumber = this.startNumber * this.countdown / this.transitionTime + this.targetNumber * (1 - this.countdown / this.transitionTime);
            } else {
                this.currentNumber = this.targetNumber;
            }
            let str = this.formatterFunc ? this.formatterFunc(this.currentNumber) : this.currentNumber.toString();
            if (this.label) this.label.string = str;
        }
    }
}