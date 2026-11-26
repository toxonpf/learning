const query = new URLSearchParams(location.search);
const flow = query.get('flow');
const result = query.get('result') === 'connected' ? 'connected' : 'error';
document.getElementById('google-result').textContent = result === 'connected'
  ? 'Google Календарь подключён' : 'Подключение Google не завершено';
if (flow) {
  history.replaceState(null, '', location.pathname);
  const channel = new BroadcastChannel('pm4-google-calendar');
  channel.postMessage({ flow, result });
  channel.close();
  window.close();
}
