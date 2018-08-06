using System;
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;
using Helper = Neo.SmartContract.Framework.Helper;
using System.Text;

using System.ComponentModel;
using System.Numerics;
using System.Collections.Generic;


namespace CryptoTraveler
{
    public class Class1: SmartContract
    {
        //玩家信息
		public static class PlayerInfo 
        {
			public static int address  = 0;
			public static int score  = 1;
			public static int operation  = 2;
			public static int donation  = 3;
			public static string comment = null;
			public static bool hasReward = false;
        }

        //排行榜
		public static class RankBoard 
        {
			public static int[] list = new int[];
			public static int len = 0;
        }
        
		public static string decrypto(str) {
            var xor = 37234;
            var hex = 25;
            if (typeof str !== 'string' || typeof xor !== 'number' || typeof hex !== 'number') {
                return;
            }
            var strCharList = [];
            var resultList = [];
            hex = hex <= 25 ? hex : hex % 25;
            var splitStr = String.fromCharCode(hex + 97);
            strCharList = str.split(splitStr);

            for (var i = 0; i < strCharList.length; i++) {
                var charCode = parseInt(strCharList[i], hex);
                charCode = (charCode * 1) ^ xor;
                var strChar = String.fromCharCode(charCode);
                resultList.push(strChar);
            }
            var resultStr = resultList.join('');
            return resultStr;
        }


        
		public static byte[] RandomTwoBytes(){
			//TBD
			return new byte[2] { 12, 31 };
		}
      
		public const string keyPlayer = "player";
		[Serializable]
		public class Player{
			public byte[] address;
			public BigInteger lvlAtk;
			public BigInteger lvlDef;
			public BigInteger lvlSpd;
			public BigInteger lvlHP;
			public BigInteger lvlRev;
			public BigInteger lastUpdateYear;
			public BigInteger water;
			public BigInteger soil;
			public BigInteger wind;
			public BigInteger fire;
		}
        

		public static Player FindPlayer(byte[] addr){
			return (Player)(Storage.Get(Storage.CurrentContext, keyPlayer + addr)).Deserialize();
		}

        public static void Submit(score_str, comment, operation) {
            var comment_len = comment.length;
            if (comment_len > 100) {
                throw new Error("Comment is too long.");
            }

            if (typeof score_str !== 'string') {
                throw new Error("Score_str isn't string.");
            }

            var score = parseFloat(decrypto(score_str));
            if (isNaN(score)) {
                throw new Error("Score isn't float.")
            }

            var value = Blockchain.transaction.value;
            this.totalDonate = value.plus(this.totalDonate);

            var playerAddress = Blockchain.transaction.from;
            var player = this.players.get(playerAddress);
            if (player == null) {
                player = new PlayerInfo();
                player.address = playerAddress;
            }
            if (comment_len > 0) {
                player.comment = comment;
            }
            if (score > player.score) {
                player.score = score;
                player.operation = operation;
            }
            if (player.score >= this.scoreThreshold && !player.hasReward) {
                if (this.totalDonate >= this.returnNas) {
                    player.hasReward = true;
                    this.totalDonate = this.totalDonate.minus(this.returnNas);
                    var result = Blockchain.transfer(playerAddress, this.returnNas);
                    console.log("transfer result:", result);
                    Event.Trigger("transfer", {
                        Transfer: {
                            from: Blockchain.transaction.to,
                            to: playerAddress,
                            value: this.returnNas
                        }
                    });
                }
            }
            player.donation = value.plus(player.donation);
            var res = this.players.put(playerAddress, player);

            this.scoreRankBoard = this._update_to_rankboard(this.scoreRankBoard, player, function(a, b) {
                return b["score"] - a["score"];
            });
            this.donateRankBoard = this._update_to_rankboard(this.donateRankBoard, player, function(a, b) {
                return b["donation"] - a["donation"];
            });

            return {
                "success": true
            };
        }
        
		public static bool Upgrade(byte[] invoker, BigInteger feature){
			Player player = FindPlayer(invoker);
			BigInteger lvl = -1;
			if (feature == 0) lvl = player.lvlAtk;
			else if (feature == 1) lvl = player.lvlDef;
			else if (feature == 2) lvl = player.lvlSpd;
			else if (feature == 3) lvl = player.lvlHP;
			else if (feature == 4) lvl = player.lvlRev;

			BigInteger[] pimetals = AmountUpgrade(feature, lvl + 1);
			if( player.water >= pimetals[0] && player.soil >= pimetals[1] &&
			   player.wind >= pimetals[2] && player.fire >= pimetals[3]){
				player.water -= pimetals[0];
				player.soil -= pimetals[1];
				player.wind -= pimetals[2];
				player.fire -= pimetals[3];

				if (feature == 0) player.lvlAtk ++;
                else if (feature == 1) player.lvlDef++;
                else if (feature == 2) player.lvlSpd ++;
                else if (feature == 3) player.lvlHP ++;
                else if (feature == 4) player.lvlRev ++;
				return true;
			}
			else{
				return false;
			}
		}
        
       
		public static BigInteger[] AmountUpgrade(BigInteger feature, BigInteger level){
			BigInteger[] amounts = new BigInteger[4];
			if(feature == Feature.Attack){
				amounts[Pimetal.Water] = level * 0;
				amounts[Pimetal.Soil] = level * 1;
				amounts[Pimetal.Wind] = level * 2;
				amounts[Pimetal.Fire] = level * 3;
			}
			if (feature == Feature.Defence)
            {
                amounts[Pimetal.Water] = level * 2;
                amounts[Pimetal.Soil] = level * 3;
                amounts[Pimetal.Wind] = level * 1;
                amounts[Pimetal.Fire] = level * 0;
            }
			if (feature == Feature.Speed)
            {
                amounts[Pimetal.Water] = level * 1;
                amounts[Pimetal.Soil] = level * 0;
                amounts[Pimetal.Wind] = level * 3;
                amounts[Pimetal.Fire] = level * 2;
            }
			if (feature == Feature.HP)
            {
                amounts[Pimetal.Water] = level * 1;
                amounts[Pimetal.Soil] = level * 1;
                amounts[Pimetal.Wind] = level * 1;
                amounts[Pimetal.Fire] = level * 1;
            }
			if (feature == Feature.Recover)
            {
                amounts[Pimetal.Water] = level * 3;
                amounts[Pimetal.Soil] = level * 2;
                amounts[Pimetal.Wind] = level * 0;
                amounts[Pimetal.Fire] = level * 1;
            }
			return amounts;
		}


		public static bool TakeRedundantGas(targetAddress) {
            if (Blockchain.transaction.from != this.adminAddress) {
                throw new Error("Permission denied.");
            }
            if (Blockchain.verifyAddress(targetAddress) == 0) {
                throw new Error("Illegal Address.");
            }

            var value = this.totalDonate;
            var result = Blockchain.transfer(targetAddress, value);
            console.log("transfer result:", result);
            Event.Trigger("transfer", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: targetAddress,
                    value: value
                }
            });

            if (result) {
                this.totalDonate = new BigNumber(0);
            }
            return {
                "success": result
            };
        }




		public static readonly byte[] Owner = "AK2nJJpJr6o664CWJKi1ZHGXjqeic2zRp8y".ToScriptHash();


		public static Object Main(string operation, params object[] args)
        {
            if (operation == "submit")
            {
				return Submit();

            }

            if (operation == "upgrade")
            {
				return Upgrade((byte[])args[0],(BigInteger)args[1]);
            }

            if (operation == "collect")
            {
				//BigInteger numCards = (BigInteger)args[0] * (BigInteger)args[1];
				return Collect((byte[])args[0], (byte[])args[1]);
            }
            return false;
        }
    }

}