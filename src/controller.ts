import * as d3 from "d3";
import { getProfilePublications } from "./lens-api";

export async function calculateReputationScore(
  metrics: { label: string; value: number }[]
) {
  const radarChartData = generateRadarChartData(metrics);
  // const radarChartPath = generateRadarChartPath(
  //   radarChartData.values,
  //   {
  //     x: 0,
  //     y: 0,
  //   },
  //   100
  // );
  const area = calculateRadarChartArea(
    radarChartData.values,
    {
      x: 0,
      y: 0,
    },
    100
  );
  console.log("area", area);
  return area;
}

function generateRadarChartData(metrics: { label: string; value: number }[]) {
  const labels = metrics.map((metric) => metric.label);
  const values = metrics.map((metric) => metric.value);

  return {
    labels,
    values,
  };
}

// async function generateRadarChartPath(data: {
//   labels: string[];
//   values: number[];
// }) {
//   const angle = d3
//     .scalePoint()
//     .range([0, Math.PI * 2])
//     .domain(data.labels);

//   const radius = 100;
//   const radiusScale = d3
//     .scaleLinear()
//     .range([0, radius])
//     .domain([0, d3.max(data.values)!]);

//   const line = d3
//     .lineRadial<number>()
//     .angle((d, i) => angle(data.labels[i])!)
//     .radius((d) => radiusScale(d)!);

//   const path = line(data.values) + "Z";
//   return path;
// }

// function calculateRadarChartArea(path: string) {
//   const points = path
//     .slice(1, -1)
//     .split("L")
//     .map((point) => {
//       const [x, y] = point.split(",").map(Number);
//       return { x, y };
//     });
//   points.push(points[0]); // close the polygon

//   let area = 0;
//   for (let i = 0; i < points.length - 1; i++) {
//     area += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
//   }
//   area /= 2;
//   return Math.abs(area);
// }

function calculateRadarChartArea(
  metrics: number[],
  center: Point,
  radius: number
): number {
  const numMetrics = metrics.length;
  const angleStep = (2 * Math.PI) / numMetrics;

  let area = 0;
  for (let i = 0; i < numMetrics; i++) {
    const value = metrics[i];
    const angle = i * angleStep - Math.PI / 2;
    const nextAngle = (i + 1) * angleStep - Math.PI / 2;
    const point1 = {
      x: center.x + radius * Math.cos(angle) * value,
      y: center.y + radius * Math.sin(angle) * value,
    };
    const point2 = {
      x:
        center.x + radius * Math.cos(nextAngle) * metrics[(i + 1) % numMetrics],
      y:
        center.y + radius * Math.sin(nextAngle) * metrics[(i + 1) % numMetrics],
    };
    area += (point1.x * point2.y - point2.x * point1.y) / 2;
  }
  return Math.abs(area);
}

export async function getProfileContentStats(profileId: string) {
  const publications = await getProfilePublications(profileId);
  if (!publications) return null;

  const publicationsStats = publications.map((publication) => {
    return {
      pubId: publication.id,
      mirrors: publication.stats.totalAmountOfMirrors,
      collects: publication.stats.totalAmountOfCollects,
      comments: publication.stats.totalAmountOfComments,
      likes: publication.stats.totalAmountOfLikes,
    };
  });
}

interface Point {
  x: number;
  y: number;
}

function generateRadarChartPath(
  metrics: number[],
  center: Point,
  radius: number
): string {
  const numMetrics = metrics.length;
  console.log("numMetrics", metrics);
  const angleStep = (2 * Math.PI) / numMetrics;

  let path = "";
  for (let i = 0; i < numMetrics; i++) {
    const value = metrics[i];
    const angle = i * angleStep - Math.PI / 2;
    const point = {
      x: center.x + radius * Math.cos(angle) * value,
      y: center.y + radius * Math.sin(angle) * value,
    };
    if (i === 0) {
      path += `M ${point.x} ${point.y} `;
    } else {
      path += `L ${point.x} ${point.y} `;
    }
  }
  path += "Z";

  return path;
}
