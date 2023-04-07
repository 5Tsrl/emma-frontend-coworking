<template>
    <div>
		<b-button @click="fitMarkers()" size="sm" class="btn btn-primary float-right"><i class="ti-fullscreen mr-1"></i>&nbsp;Visualizza tutti gli spazi</b-button>
		<br>
		<!-- <b-button v-b-toggle.collapse-1 variant="secondary">Filtro</b-button>
 	<b-collapse id="collapse-1" class="mt-2">
		<b-form-select v-model="selected" :options="options" size="sm" class="mt-3" text-field="Città"></b-form-select>

    </b-collapse> -->
		
		<div id="map-container" class="mt-3">
				<div id="spinner-container" class="text-center" v-if="loading">
					<b-spinner id="spinner" variant="success" label="Spinning"></b-spinner>
				</div>
				<l-map id="my-map"  :zoom="zoom" :center="center" :options="getMapOptions"
					@update:center="centerUpdate" @update:zoom="zoomUpdate" ref="map">
					<l-tile-layer :url="getTilesUrl" :attribution="getMapAttribution" :options="getLayerOptions" />

					<span v-if="offices_layer.length > 0">
						<l-marker v-for="office in offices_layer" :key="office.id" :lat-lng="[office.lat, office.lon]"
							:icon="companyIcon(office.coworking)" :options="{ title: office.name }">
							<l-popup ><strong>{{ office.company.name }}</strong><br><b-link
									:to="`/offices/edit/${office.id}`">{{ office.name }}</b-link>
									<div v-for="cow in office.info_coworking">
										<br><strong v-if="office.coworking == 1 && office.info_coworking!=null">Sale: {{ cow.sale }}</strong>
										<br><strong v-if="office.coworking == 1 && office.info_coworking!=null">Costo: {{ cow.costo }} €</strong>
										<br><b-link
										v-if="office.coworking == 1 && office.info_coworking!=null" :to="cow.link">Prenotazione</b-link>
									</div>
								
							</l-popup>
						</l-marker>
					</span>					

					<l-wms-tile-layer :key="wmsRenderKey"
						base-url="http://geomap.reteunitaria.piemonte.it/ws/siccms/coto-01/wmsg01/wms_sicc124_mobilita"
						:visible="true" :layers="selectedWmsLayers" :transparent="true" format="image/png">
					</l-wms-tile-layer>
				</l-map>
		</div>		
    </div>
</template>

<script>
import Util from "@/mixing/util";
import L from "leaflet";
import { latLng } from "leaflet";
import { LMap, LTileLayer, LMarker, LCircleMarker, LWMSTileLayer, LPopup } from "vue2-leaflet";
import "leaflet/dist/leaflet.css";
import UserService from "@/services/user.service";

// const companyIcon = L.divIcon({
// 	html: "<i class=\"fa fa-building-o fa-2x\"></i>",
// 	iconSize: [20, 20],
// 	className: "myDivIcon",
// });
// const companyIcongre = L.divIcon({
// 	html: "<i class=\"fa fa-building-o fa-2x\" style=\"color:green\"></i>",
// 	iconSize: [20, 20],
// 	className: "myDivIcon",
// });

export default {
	mixins: [Util],
	components: {
		LMap,
		LMarker,
		LTileLayer,
		LCircleMarker,
		LPopup,
		"l-wms-tile-layer": LWMSTileLayer,				
	},
	async created () {	
		this.loading = true;	
		let response = await UserService.getOffices(null, "id, name, company_id, lat, lon, Companies.name, Companies.type, address, city,coworking,info_coworking");
		this.office_list = response.data.offices;
		this.offices_layer = this.generateLayer(this.office_types);
		this.loading = false;
		this.fitMarkers();		
	},
	data() {
		return {
			zoom: 18,
			center: latLng(45.070339, 7.686864),
			currentZoom: 11.5,
			currentCenter: latLng(45.070339, 7.686864),
			showMap: true,
			uffici_azienda: [],
			office_id: [],
			offices_layer: [],
			office_types: [1, 2, 8, 9],
			schools_layer: [],
			school_types: [3, 4, 5, 6, 7],
			office_list: [],
			azienda: { id: 0 },
			aziende: [],
			loading: false,
			// companyIcon: null,
			wms_layers: [
				{ value: "M-Linee", text: "Linee Metro" },
				{ value: "M-Fermate", text: "Fermate Metro" },
				{ value: "BikeSharing", text: "Bike Sharing" },
				{ value: "P-Ciclabili", text: "Percorsi Ciclabili" },
			],
			wms_layers_selezionati: ["BikeSharing", "P-Ciclabili"],
			wmsRenderKey: Date.now(),
		};
	},
	computed: {
		selectedWmsLayers: function () {
			return this.wms_layers_selezionati.join(",");
		},
	},
	methods: {
		zoomUpdate(zoom) {
			this.currentZoom = zoom;
		},
		centerUpdate(center) {
			this.currentCenter = center;
		},
		fitMarkers() {
			this.$refs.map.mapObject.fitBounds(this.offices_layer);
		},
		generateLayer: function (types) {
			return this.office_list.filter((x) => {
				if (x.company !== undefined && x.company !== null && x.lat != null && types.includes(x.company.type)) {
					return true;
				}
			});
		},
		companyIcon(cow) {
			if(cow==1){
				return L.divIcon({
					html: "<i class=\"fa fa-building-o fa-2x\" style=\"color:red\"></i>",
					iconSize: [20, 20],
					className: "myDivIcon",
				});
			}else{
				return L.divIcon({
					html: "<i class=\"fa fa-building-o fa-2x\"></i>",
					iconSize: [20, 20],
					className: "myDivIcon",
				});
			}
			
		},

	},
};
</script>

<style scoped>
@import "~leaflet.markercluster/dist/MarkerCluster.css";
@import "~leaflet.markercluster/dist/MarkerCluster.Default.css";
@import "~vue-select/dist/vue-select.css";

.myDivIcon {
	text-align: center;
	/* Horizontally center the text (icon) */
	line-height: 20px;
	/* Vertically center the text (icon) */
}

#map-container {
	position: relative;
	height: 90vh;
	min-height: 300px;
}

#spinner-container {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 500;
}

#spinner {
	position: relative;
	top: 50%;
}
</style>
