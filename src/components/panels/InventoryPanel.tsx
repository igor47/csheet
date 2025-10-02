export const InventoryPanel = () => {
  return (
    <div class="accordion-body">
      <table class="table table-sm align-middle">
        <thead class="table-light">
          <tr><th>Item</th><th>Qty</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Rope (50 ft)</td><td>1</td><td>Hempen</td></tr>
          <tr><td>Rations</td><td>6</td><td>Days</td></tr>
          <tr><td>Healing Potion</td><td>2</td><td>2d4+2</td></tr>
        </tbody>
      </table>
    </div>
  );
}
