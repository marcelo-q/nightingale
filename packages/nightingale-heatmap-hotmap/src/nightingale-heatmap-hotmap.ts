import { html } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from 'lit-html/directives/style-map.js';
import heatmapStyleSheet from './heatmap-component.css';

import NightingaleElement, { customElementOnce, withDimensions, withHighlight, withManager, withMargin, withPosition, withResizable, withZoom } from "@nightingale-elements/nightingale-new-core";
import { Heatmap } from "heatmap-component";
import { attrd, formatDataItem } from "heatmap-component/lib/heatmap-component/utils";
import { scaleLinear } from "d3";
import { Class as HeatmapClassNames } from "heatmap-component/lib/heatmap-component/class-names";
import { Box, scaleDistance } from "heatmap-component/lib/heatmap-component/scales";

interface HotmapData {
  xValue: number;
  yValue: string;
  score: number;
  [key: string]: any;
}

@customElementOnce("nightingale-heatmap-hotmap")
class NightingaleHeatmapHotmap extends withManager(
  withZoom(
    withResizable(
      withMargin(
        withPosition(withDimensions(withHighlight(NightingaleElement))),
      ),
    ),
  ),
) {
  @property({ type: String })
  heatmapId!: string;
  
  heatmapDomainX?: number[];
  heatmapDomainY?: string[];
  heatmapData?: HotmapData[];
  heatmapInstance?: Heatmap<number, string, HotmapData>;

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (
      name.startsWith("display-")
    ) {
      if (oldValue !== newValue) this.triggerHeatmapZoom();
    } else if (
      name === "highlight"
    ) {
      if (oldValue !== newValue) this.triggerHeatmapHighlight();
    }
  }

  connectedCallback() {
    super.connectedCallback();
  }

  shouldUpdate(changedProperties: Map<string, any>) {

    const hasHighlightDefined = changedProperties.has('highlight') && changedProperties.get('highlight') !== undefined;
    const hasDisplayStDefined = changedProperties.has('display-start') && changedProperties.get('display-start') !== undefined;
    const hasDisplayEndDefined = changedProperties.has('display-end') && changedProperties.get('display-end') !== undefined;

    return !hasHighlightDefined && !hasDisplayStDefined && !hasDisplayEndDefined;
  }

  render() {
    const mainStyles = {
      width: this.width + "px",
      paddingLeft: "10px",
      paddingRight: "10px"
    };
    const heatmapStyles = {
      width: (this.width-20) + "px",
      height: this.height + "px",
      zIndex: 1,
      display: "none"
    }
    const loadingStyles = {
      width: (this.width-20) + "px",
      textAlign: 'center'
    }
    // style tag here may seem strange but see: https://lit.dev/docs/v1/lit-html/styling-templates/#rendering-in-shadow-dom
    return html`
      <style>
        #${this.heatmapId} {
          /** Position of bottom-left corner of tooltip box relative to the mouse position */
          --tooltip-offset-x: 5px;
          /** Position of bottom-left corner of tooltip box relative to the mouse position */
          --tooltip-offset-y: 8px;
        }
        ${heatmapStyleSheet}
      </style>

      <div style=${styleMap(mainStyles)}">
        <div id="${this.heatmapId}" style=${styleMap(heatmapStyles)}"></div>
      </div>
      <div id="${this.heatmapId}_loading" style=${styleMap(loadingStyles)}">
        <svg width="200px" height="200px"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" style="background: none;">
          <circle cx="75" cy="50" fill="#363a3c" r="6.39718">
              <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s" repeatCount="indefinite" begin="-0.875s"></animate>
          </circle>
          <circle cx="67.678" cy="67.678" fill="#363a3c" r="4.8">
              <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s" repeatCount="indefinite" begin="-0.75s"></animate>
          </circle>
          <circle cx="50" cy="75" fill="#363a3c" r="4.8">
              <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s" repeatCount="indefinite" begin="-0.625s"></animate>
          </circle>
          <circle cx="32.322" cy="67.678" fill="#363a3c" r="4.8">
              <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s" repeatCount="indefinite" begin="-0.5s"></animate>
          </circle>
          <circle cx="25" cy="50" fill="#363a3c" r="4.8">
              <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s" repeatCount="indefinite" begin="-0.375s"></animate>
          </circle>
          <circle cx="32.322" cy="32.322" fill="#363a3c" r="4.80282">
              <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s" repeatCount="indefinite" begin="-0.25s"></animate>
          </circle>
          <circle cx="50" cy="25" fill="#363a3c" r="6.40282">
              <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s" repeatCount="indefinite" begin="-0.125s"></animate>
          </circle>
          <circle cx="67.678" cy="32.322" fill="#363a3c" r="7.99718">
              <animate attributeName="r" values="4.8;4.8;8;4.8;4.8" times="0;0.1;0.2;0.3;1" dur="1s" repeatCount="indefinite" begin="0s"></animate>
          </circle>
        </svg>
      </div>
    `;
  }

  setHeatmapData(
    xDomain: number[],
    yDomain: string[],
    data: HotmapData[]
  ) {
    this.heatmapDomainX = xDomain;
    this.heatmapDomainY = yDomain;
    if (!this.heatmapData) {
      this.heatmapData = data;
      this.renderHeatmap();
    } else {
      this.heatmapData = data;
      this.heatmapInstance!.setData({
        xDomain: xDomain,
        yDomain: yDomain,
        items: data,
        x: (d) => {
          const x = d.start;
          return x;
        },
        y: (d) => {
          if (d.yValue) {
            return d.yValue
          }
          return "none";
        },
      });
    }
  }

  renderHeatmap() {
    document.getElementById(this.heatmapId)!.style.display = "";
    document.getElementById(`${this.heatmapId}_loading`)!.style.display = "none";

    const hm = Heatmap.create({
      xDomain: this.heatmapDomainX!,
      yDomain: this.heatmapDomainY!,
      items: this.heatmapData!,
      x: (d) => {
        const x = d.xValue;
        return x;
      },
      y: (d) => {
        if (d.yValue) {
          return d.yValue;
        }
        return "none";
      },
    });

    const dataMin = Math.min(...this.heatmapData!.map((datum) => datum.score));
    const dataMax = Math.max(...this.heatmapData!.map((datum) => datum.score));

    const colorScale = scaleLinear(
      [dataMin, dataMax],
      ["#ff898b", "#b20003"]
    );
    hm.setColor((d) => colorScale(d.score));

    hm.setTooltip(
      (d, x, y, xIndex, yIndex) => {
        let returnHTML = `
        <b>Your are at</b> <br />

        x,y: <b>${d.xValue},${d.yValue}</b><br />
        score: <b>${formatDataItem(d.score)}</b>`;
        return returnHTML;
      }
    );
    hm.setZooming({ axis: 'x' });
    hm.setVisualParams({ xGapPixels: 0, yGapPixels: 0 });
    this.heatmapInstance = hm;

    this.heatmapInstance.events.zoom.subscribe((d) => {
      if (!d) return;
      // On heatmap zoom dispatch event to Protvista
      if (d.xMin + 0.5 !== this["display-start"]) {
        this.dispatchEvent(
          new CustomEvent("change", {
            detail: {
              value: d.xMin + 0.5,
              type: "display-start",
            },
            bubbles: true,
          }),
        );
      }
      if (d.xMax - 0.5 !== this["display-end"]) {
        this.dispatchEvent(
          new CustomEvent("change", {
            detail: {
              value: d.xMax - 0.5,
              type: "display-end",
            },
            bubbles: true,
          }),
        );
      }
    });


    this.heatmapInstance.events.hover.subscribe((d) => {
      if (!d) return;
      // On heatmap zoom dispatch event to Protvista
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: {
            value: `${d.xIndex+1}:${d.xIndex+1}`,
            type: "highlight",
          },
          bubbles: true,
        })
      );

    });

    this.heatmapInstance.render(this.heatmapId!);
    this.heatmapInstance.events.render.subscribe((d) => {
      this.triggerHeatmapZoom();
    });
  }

  triggerHeatmapZoom() {
    const toStart = this["display-start"]!;
    const toEnd = this["display-end"]!;

    if (this.heatmapInstance) {
      this.heatmapInstance.zoom({
        xMin: toStart - 0.5,
        xMax: toEnd + 0.5,
      });
    }
  }

  triggerHeatmapHighlight() {
    const highlight = this["highlight"]!;

    if (this.heatmapInstance) {
      // any so we can use private marker attributes
      const heatmapInstanceMarker = (<any>this.heatmapInstance.extensions.marker!);

      if (!highlight) { // highlight null means no highlight to be shown
        heatmapInstanceMarker.state.dom.svg.selectAll('.' + HeatmapClassNames.Marker).remove();
        heatmapInstanceMarker.state.dom.svg.selectAll('.' + HeatmapClassNames.MarkerX).remove();
        heatmapInstanceMarker.state.dom.svg.selectAll('.' + HeatmapClassNames.MarkerY).remove();
        return;
      };

      // parse highlight start and end residues as indexes
      const highlightStart = parseInt(highlight.split(":")[0])-1;
      const highlightEnd = parseInt(highlight.split(":")[1])-1;

      // calculate x and width inside the canvas
      const x = heatmapInstanceMarker.state.scales.worldToCanvas.x(highlightStart);
      const width = scaleDistance(heatmapInstanceMarker.state.scales.worldToCanvas.x, Math.max((highlightEnd-highlightStart)+1, 1));

      // use class name, static and dynamic attributes
      const className = HeatmapClassNames.MarkerY;
      const staticAttrs = { rx: heatmapInstanceMarker.params.markerCornerRadius, ry: heatmapInstanceMarker.params.markerCornerRadius };
      const dynamicAttrs = {
        x,
        y: heatmapInstanceMarker.state.boxes.canvas.ymin,
        width,
        height: Box.height(heatmapInstanceMarker.state.boxes.canvas),
        fill: `#${this["highlight-color"]}`,
        fillOpacity: 0.9,
      };

      // create marker inside canvas svg element
      const marker = heatmapInstanceMarker.state.dom.svg.selectAll('.' + className).data([1]);
      attrd(marker.enter().append('rect'), { class: className, ...staticAttrs, ...dynamicAttrs });
      attrd(marker, dynamicAttrs);
    }

  }
 
}
export default NightingaleHeatmapHotmap;
