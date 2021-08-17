let map = L.map("map").setView([51.505548, -0.075316], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let svgLayer = L.svg();
svgLayer.addTo(map)

let radius = 10;
let xarr = [100, 200, 300]

d3.json("data.json").then(data => {
  data.nodes.forEach((d, i) => {
    d.latLong = new L.LatLng(d.lat, d.lon);
    d.layerPoint = map.latLngToLayerPoint(d.latLong)
    // d.x = 100;
    // d.x = xarr[i % 3];
    // d.y = 100;
  });

  data.links.forEach((d) => {
    d.source = d.from;
    d.target = d.to;
  });
  
  const ticked = () => {
    // const line = d3.select("body>svg")
    const line = d3.select("#map").select("svg").select("g")
    .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke", "red")
    .attr("stroke-opacity", 0.3)
    .attr("stroke-width", 5)
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y)
  
    // const circle = d3.select("body>svg")
    const circle = d3.select("#map").select("svg").select("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", radius)
      .attr("fill", "blue")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .each((d) => {
        if (d.type === "parent"){
          d.fx = d.layerPoint.x
          d.fy = d.layerPoint.y
        }
      })
  }

  const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink().links(data.links).id(d => d.id))
    // .force('link', d3.forceLink().links(data.links).id(d => d.id).distance(100))
    // .force('charge', d3.forceManyBody().strength(5))
    .force('charge', d3.forceManyBody())
    .force('collision', d3.forceCollide().radius(radius))
    .force('x', d3.forceX().x(d => d.layerPoint.x))
    .force('y', d3.forceY().y(d => d.layerPoint.y))
    // .force('x', d3.forceX().x(d => d.x).strength(0.06))
    // .force('y', d3.forceY().y(d => d.y).strength(0.04))
    .on('tick', () => {
      ticked()
    })

})