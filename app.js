const button = document.getElementById("scan");
const message = document.getElementById("message");
const stamps = document.querySelectorAll(".stamp");

// ページ読み込み時にローカル保存から復元
stamps.forEach(stamp => {
  const id = stamp.dataset.id;
  if (localStorage.getItem("stamp-" + id)) {
    stamp.classList.add("collected");
  }
});

button.addEventListener("click", async () => {
  try {
    message.textContent = "micro:bit を探しています…";

    // UARTサービスのUUID（Nordic UART Service）
    const UART_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    const TX_CHAR = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // notify (micro:bit → Web)

    // micro:bit デバイスを探す
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [UART_SERVICE] }]
    });

    message.textContent = `接続中: ${device.name}...`;
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(UART_SERVICE);
    const txChar = await service.getCharacteristic(TX_CHAR);

    // 通知を購読
    await txChar.startNotifications();
    txChar.addEventListener("characteristicvaluechanged", event => {
      const value = new TextDecoder().decode(event.target.value);
      const text = value.trim().toLowerCase();
      message.textContent = `受信: ${text}`;

      stamps.forEach(stamp => {
        if (text.includes(stamp.dataset.id)) {
          stamp.classList.add("collected");
          localStorage.setItem("stamp-" + stamp.dataset.id, "1");
          message.textContent = `${stamp.textContent} のスタンプを獲得！`;
        }
      });
    });

  } catch (err) {
    console.error(err);
    message.textContent = "接続に失敗しました: " + err;
  }
});
