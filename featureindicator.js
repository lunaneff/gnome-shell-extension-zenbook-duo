import GObject from 'gi://GObject';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import {panel} from 'resource:///org/gnome/shell/ui/main.js';

const QuickSettingsMenu = panel.statusArea.quickSettings;

const FeatureSlider = GObject.registerClass(
class FeatureSlider extends QuickSettings.QuickSlider {
    _init(onSliderChgCb, onBtnClickCb) {
        log('FeatureSlider._init');
        
        super._init({
            iconName: 'night-light-symbolic',
            iconReactive: true,
            //menuEnabled: true,
        });

        // Set an accessible name for the slider
        this.slider.accessible_name = 'Brightness';
        
        this._sliderChangedId = this.slider.connect('notify::value',
            () => onSliderChgCb(this.getValue())
        );

        this._sliderIconClickedId = this.connect('icon-clicked',
            () => onBtnClickCb()
        );
    }

    setValue(sliderValue, notify) {
        // sliderValue: 0.0 - 1.0
        if (!notify) {
            this.slider.block_signal_handler(this._sliderChangedId);
        }
        //log('padSliderUpdate '+this.slider.value + ', notify:'+notify);
        this.slider.value = sliderValue;
        if (!notify) {
            this.slider.unblock_signal_handler(this._sliderChangedId);
        }
    }

    getValue() {
        // 0.0 - 1.0
        return this.slider.value;
    }

    setLinkedStatus(isLinked) {
        this.iconName = isLinked ? 'changes-prevent-symbolic' : 'night-light-symbolic';  // or 'night-light-disabled-symbolic'
    }
});

export const FeatureIndicator = GObject.registerClass(
class FeatureIndicator extends QuickSettings.SystemIndicator {
    _init(onMainSliderChgCb, onPadSliderChgCb, onSliderBtnClickCb) {
        super._init();

        // Create the slider and associate it with the indicator, being sure to
        // destroy it along with the indicator
        this._brightnessSlider = new FeatureSlider(onPadSliderChgCb, onSliderBtnClickCb);
        this.quickSettingsItems.push(this._brightnessSlider);

        this.connect('destroy', () => {
            this.quickSettingsItems.forEach(item => item.destroy());
        });

        // Add the slider to the menu, this time passing `2` as the second
        // argument to ensure the slider spans both columns of the menu
        for(const item of this.quickSettingsItems) {
            QuickSettingsMenu.menu.addItem(item, 1);
        }

        this.mainBrightnessSlider = null;
        const mainBrightnessItem = this._findMainBrightnessItem();
        if (mainBrightnessItem !== null) {
            // position screenpad-slider below main brightness slider
            QuickSettingsMenu.menu._grid.set_child_above_sibling(
                this._brightnessSlider, mainBrightnessItem);
    
            this.mainBrightnessSlider = mainBrightnessItem.slider;
            this._sliderChangedId = this.mainBrightnessSlider.connect('notify::value',
                () => onMainSliderChgCb(this.getMainSliderBrightness())
            );
        } else {
            log('Zenbook-Duo extension could not find main brightness slider. Linking brightness is not possible!');
        }
    }

    getMainSliderBrightness() {
        // 0.0 - 1.0
        return this.mainBrightnessSlider !== null ?  this.mainBrightnessSlider.value : -1;
    }

    getScreenpadSliderBrightness() {
        // 0.0 - 1.0
        return this._brightnessSlider.getValue();
    }

    setScreenpadSliderValue(value, notify) {
        this._brightnessSlider.setValue(value, notify);
    }

    setLinkedStatus(isLinked) {
        this._brightnessSlider.setLinkedStatus(isLinked);
    }

    _findMainBrightnessItem() {
        // search for gnomes default brightness slider (don't know a better was as of now)
        for (const item of QuickSettingsMenu.menu._grid.get_children()) {
            let name = item.constructor.name.toString();
            if (name.includes('Brightness') && item.hasOwnProperty('slider')) {
                return item;
            }
        }
        return null;
    }
});
