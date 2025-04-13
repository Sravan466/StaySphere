const listingCoordinates = listing?.geometry?.coordinates || [80.1514, 17.2473];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: listingCoordinates,
  zoom: 13
});

// Pulsing Dot Animation
const size = 200;
const pulsingDot = {
  width: size,
  height: size,
  data: new Uint8Array(size * size * 4),

  onAdd() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    this.context = canvas.getContext('2d');
  },

  render() {
    const duration = 1000;
    const t = (performance.now() % duration) / duration;

    const radius = (size / 2) * 0.15;
    const outerRadius = (size / 2) * 0.7 * t + radius;
    const context = this.context;

    context.clearRect(0, 0, this.width, this.height);

    // Outer pulsing ring
    context.beginPath();
    context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
    context.fillStyle = `rgba(126, 200, 200, ${1 - t})`;
    context.fill();

    // Smaller solid dot
    context.beginPath();
    context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
    context.fillStyle = 'rgb(0, 180, 180)';
    context.strokeStyle = 'white';
    context.lineWidth = 2 + 4 * (1 - t);
    context.fill();
    context.stroke();

    this.data = context.getImageData(0, 0, this.width, this.height).data;

    map.triggerRepaint();
    return true;
  }
};

map.on('load', () => {
  map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

  map.addSource('listing-point', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: listingCoordinates
        }
      }]
    }
  });

  map.addLayer({
    id: 'listing-point',
    type: 'symbol',
    source: 'listing-point',
    layout: {
      'icon-image': 'pulsing-dot'
    }
  });

  new maplibregl.Marker()
    .setLngLat(listingCoordinates)
    .setPopup(
      new maplibregl.Popup({ offset: 25 }).setHTML(
        `<h4>${listing?.location || "Listing"}</h4><p>Exact Location provided after booking</p>`
      )
    )
    .addTo(map);
});
