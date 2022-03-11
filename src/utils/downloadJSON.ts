export default function downloadJSON (json: Object, name: string): void {
  const anchor = document.createElement('a');
  anchor.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, 2));
  anchor.download = name + '.json';
  anchor.click();
}
