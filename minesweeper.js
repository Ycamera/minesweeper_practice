//ゲームの機能・処理ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー

//全てのマスの座標のID
const areas = [];
for (let y = 0; y < 9; y++) {
	for (let x = 0; x < 9; x++) {
		areas.push(`f${y}${x}`);
	}
}

//マスの周囲探索用の計算座標
const direc = [
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0],
	[1, 1],
	[-1, -1],
	[-1, 1],
	[1, -1],
];

//爆弾の設置場所をランダムに選択　設置する爆弾のIDを返す
function setMine(numberOfBombs, id) {
	let chooseAreas = areas.slice();
	let selectedBombArea = []; //爆弾をセットする座標を格納
	let tmpArea = [];

	for (let i = 0; i < numberOfBombs; i++) {
		let randomNumber = Math.floor(Math.random() * chooseAreas.length);

		if (chooseAreas[randomNumber] === id) {
			//最初のマスが爆弾だった場合は他のマスに振り直し
			tmpArea.push(chooseAreas.splice(randomNumber, 1)[0]);
			i--;
		} else {
			selectedBombArea.push(chooseAreas.splice(randomNumber, 1)[0]);
		}
	}
	if (tmpArea.length > 0) chooseAreas.push(tmpArea);

	//爆弾が設置される周りのマスを抽出、数字を代入
	function NumberOfMinesAroundField(selectedBombs) {
		let numberArea = {}; //数字を代入するマスを格納

		selectedBombs.forEach((id) => {
			let idsAround = idsAroundTheObject(id);
			direc.forEach((yx) => {
				let y = Number(id[1]) + yx[0];
				let x = Number(id[2]) + yx[1];

				if (0 <= y && y <= 8 && 0 <= x && x <= 8) {
					if (!(`f${y}${x}` in numberArea)) {
						let count = 0;

						direc.forEach((yx) => {
							y2 = y + yx[0];
							x2 = x + yx[1];

							if (0 <= y2 && y2 <= 8 && 0 <= x2 && x2 <= 8) {
								if (selectedBombs.includes(`f${y2}${x2}`))
									count++;
							}
						});
						numberArea[`f${y}${x}`] = count;
					}
				}
			});
		});
		return numberArea;
	}

	return {
		bombArea: selectedBombArea, // return ['f51','f07','f75'] 爆弾の場所
		bombNumber: NumberOfMinesAroundField(selectedBombArea), //return objects {'f47: 5', 'f14': 6} key = 場所、value = 爆弾の数
		openToClear: chooseAreas.sort().join(""), //return クリア判定用の開けるべきマスを String で示す
	};
}

//爆弾クリック時の処理
let areaOfBombs;
/*
areaOfBombs
bombArea: 爆弾の場所を示す Array
bombNumber: 周りの爆弾の数を示す　Object　key = 場所、value = 爆弾の数
openToClear: クリア判定用の開けるべきマスを String で示す
*/

let opened = []; //開いたマスを記憶

//開いた数マスの周囲の全ての爆弾に旗が立てられていた場合 click = 周囲の開いてないマスを開ける
function openAroundTheNumber(event) {
	let f = event.target;
	id = f.id;

	let idsAround = idsAroundTheObject(id);
	let count = 0;

	idsAround.forEach((ids) => {
		if (document.getElementById(ids).className.split(" ").includes("flag"))
			count++;
	});

	if (f.innerHTML === String(count)) {
		idsAround.forEach((id) => {
			if (!opened.includes(id)) {
				//既に開いたマスは無視
				openEmpty(id);
			}
		});
	}
}

//id を渡すと周囲のマスの id を格納した array を返す
function idsAroundTheObject(id) {
	let ids = [];
	direc.forEach((d) => {
		let y = Number(id[1]) + d[0];
		let x = Number(id[2]) + d[1];

		if (0 <= y && y <= 8 && 0 <= x && x <= 8) {
			ids.push(`f${y}${x}`);
		}
	});
	return ids;
}

//マスをクリックした時の処理
function openEmpty(id) {
	let f = document.getElementById(id);
	let flag = !f.className.split(" ").includes("flag");

	if (flag) {
		//旗が立てなければクリック処理を実行

		f.style.backgroundImage = "none";
		f.classList.remove("notOpened");

		if (opened.length === 0) {
			//最初のマスを開いたときに爆弾をセット
			areaOfBombs = setMine(numberOfbombsToSet, id); //左：爆弾の数
			timestart(); // タイマー起動
		}

		if (!opened.includes(id)) opened.push(id);

		if (areaOfBombs.bombArea.includes(id)) {
			//爆弾を示す
			f.style.color = "black";
			f.classList.add("bomb");
			f.style.backgroundImage = bombImage;

			gameover(); // ゲーム終了
		} else if (id in areaOfBombs.bombNumber) {
			//周りの爆弾の数を示す
			const num = areaOfBombs.bombNumber[id];
			f.innerHTML = num;
			const colors = [
				"blue",
				"green",
				"red",
				"darkblue",
				"darkred",
				"mediumspringgreen",
				"black",
				"dimgray",
			]; //数字の色
			f.style.color = colors[num - 1];

			f.addEventListener("click", openAroundTheNumber);
			f.addEventListener("mousedown", openAroundTheNumber);
		} else {
			//周囲のマスを開く
			let idsAround = idsAroundTheObject(id);
			setTimeout(function () {
				idsAround.forEach((id) => {
					if (!opened.includes(id)) {
						//既に開いたマスは無視
						openEmpty(id);
					}
				});
			}, 30);
		}
		if (opened.sort().join("") == areaOfBombs.openToClear) {
			//ゲームのクリア判定、
			clear();
		}

		f.removeEventListener("click", bombClick);
		f.removeEventListener("contextmenu", flagClick);
	}
}

//左クリック処理の付加
function bombClick(event) {
	openEmpty(event.target.id);
}

const bombImage = "url('./images/bomb.001.png')";
const flagImage = "url('./images/Flag.001.png')";
const gradientImage =
	"linear-gradient(to bottom right, dodgerblue 0%, lightblue)";

//右クリック　旗を立てて外す処理
function flagClick(event) {
	let f = event.target;
	f.classList.toggle("flag");
	flagNum = document.getElementById("numberOfFlags");

	if (f.className.split(" ").includes("flag")) {
		f.style.backgroundImage = `${flagImage},${gradientImage}`;
		flagNum.innerHTML = Number(flagNum.innerHTML) - 1;
	} else {
		f.style.backgroundImage = gradientImage;
		flagNum.innerHTML = Number(flagNum.innerHTML) + 1;
	}
}

//タイマー機能
let timeset;
function timestart() {
	timeset = setInterval(function () {
		let f = document.getElementById("timeclock");
		f.innerHTML = Number(f.innerHTML) + 1;
	}, 1000); // タイマーの起動
}

function timestop() {
	//タイマーの停止
	clearInterval(timeset);
}

//ゲームを停止
function stop() {
	timestop();
	restartReady = false;
	areas.forEach((id) => {
		let f = document.getElementById(id);
		f.removeEventListener("click", bombClick);
		f.removeEventListener("contextmenu", flagClick);
		f.removeEventListener("click", openAroundTheNumber);
		f.removeEventListener("mousedown", openAroundTheNumber);
		f.classList.remove("notOpened");

		f.style.transition = "transform 2s ease-in";
	});
}

//ゲームオーバー時にマスを崩壊させる　CSS をマスに付加

const boomIds = boomIdArray();
function boomIdArray() {
	let array = [];
	for (let i = 0; i < 9; i++) {
		if (i % 2 === 1) {
			num = 8;
		} else {
			num = 0;
		}
		for (let j = 0; j < 9; j++) {
			array.push(`f${i}${Math.abs(num - j)}`);
		}
	}
	return array;
}

function boom() {
	let delay = 10;

	for (let i = 0; i < boomIds.length; i++) {
		setTimeout(function () {
			id = boomIds[i];
			f = document.getElementById(id);
			f.style.zIndex = `${90 - Number(`${id[1]}${id[2]}`)}`;

			let randomY = Math.random() * 3000;
			let randomX = Math.random() * 1500;
			if (Number(id[2]) < 4) {
				randomX *= -1;
			} else if (Number(id[2]) === 5) {
				let c = [1, -1];
				randomX *= c[Math.floor(Math.random() * 2)];
			}

			let randomDeg = Math.random() * 360;

			if (!restartReady)
				f.style.transform = `translateY(${
					randomY + 5000
				}%) translateX(${randomX}%) rotate(${randomDeg}deg)`;
		}, delay * i);
	}
}

//ゲームの進行管理ーーーーーーーーーーーーーーーーーーーーーーーーーーーーー

let restartReady = true; //リスタート時に不必要な爆発処理を防ぐ

//セットする爆弾の数
const numberOfbombsToSet = 10;

//クリア！
function clear(event) {
	stop();

	endEffect("clear");
}

//ゲームオーバー
function gameover(event) {
	stop();
	endEffect("boom");
	boom();
}

//終了時の演出
function endEffect(id) {
	document.getElementById(id).classList.add("appear");
	document.getElementById("announce").classList.add("appear");
}

//ゲームを開始
function start() {
	restartReady = true;
	opened = [];
	areaOfBombs = NaN;

	document.getElementById("numberOfFlags").innerHTML = numberOfbombsToSet; //爆弾の数をフラグにセット
	timestop(); //タイマー停止
	document.getElementById("timeclock").innerHTML = 0;

	areas.forEach((id) => {
		let f = document.getElementById(id);
		f.style.backgroundImage = gradientImage;
		f.innerHTML = "";
		f.classList.remove("flag"); //flagクラスを取り除く
		f.classList.remove("bomb"); //bombクラスを取り除く
		f.style.transform = "translate(0, 0)"; //散らばったマスを元の位置へ移動
		f.style.transition = "transform 0.5s ease-in-out";

		let parent = document.getElementById("announce"); //Clear用のクラスを取り除く
		parent.classList.remove("appear");
		for (let i = 0; i < parent.children.length; i++) {
			let child = parent.children[i];
			if (child.id === "clear" && child.className === "appear") {
				document.getElementById("announce").classList.add("active");
				child.classList.add("active");
			} else if (child.id === "boom" && child.className === "appear") {
				document.getElementById("announce").classList.add("active");
				child.classList.add("active");
			}

			child.classList.remove("appear");
		}

		f.classList.add("notOpened"); //開いていないマスクラスを追加

		f.addEventListener("click", bombClick);
		f.addEventListener("contextmenu", flagClick);
	});
}

//Restart ボタンを押すとゲームをリセット
document.getElementById("restart").addEventListener("click", function () {
	start();
});

start(); //初回のゲームスタート
