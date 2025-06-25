// 自定义颜色选择器
class CustomColorPicker {    constructor() {
        this.isVisible = false;
        this.currentColor = '#6366f1';
        this.onSave = null;
        this.onCancel = null;
        this.hue = 0;
        this.saturation = 100;
        this.lightness = 50;
        console.log('CustomColorPicker: 初始化自定义颜色选择器');
        this.createColorPicker();
    }

    createColorPicker() {
        // 创建颜色选择器容器
        this.pickerElement = document.createElement('div');
        this.pickerElement.className = 'custom-color-picker';
        this.pickerElement.style.display = 'none';
        
        this.pickerElement.innerHTML = `
            <div class="color-picker-content">
                <div class="color-picker-header">
                    <span class="color-picker-title">选择颜色</span>
                    <button class="color-picker-close" type="button">×</button>
                </div>
                <div class="color-picker-body">
                    <!-- 主色调选择区域 -->
                    <div class="color-main-area">
                        <div class="color-saturation-lightness" id="saturation-lightness">
                            <div class="saturation-overlay"></div>
                            <div class="lightness-overlay"></div>
                            <div class="color-cursor" id="sl-cursor"></div>
                        </div>
                    </div>
                    
                    <!-- 色调滑块 -->
                    <div class="color-hue-area">
                        <div class="hue-slider" id="hue-slider">
                            <div class="hue-cursor" id="hue-cursor"></div>
                        </div>
                    </div>
                    
                    <!-- 颜色预览 -->
                    <div class="color-preview-area">
                        <div class="color-preview" id="color-preview"></div>
                        <div class="color-input-group">
                            <label>HEX</label>
                            <input type="text" id="hex-input" maxlength="7" placeholder="#6366f1">
                        </div>
                    </div>
                    
                    <!-- 预设颜色 -->
                    <div class="preset-colors">
                        <div class="preset-color" data-color="#3b82f6" style="background-color: #3b82f6;"></div>
                        <div class="preset-color" data-color="#10b981" style="background-color: #10b981;"></div>
                        <div class="preset-color" data-color="#8b5cf6" style="background-color: #8b5cf6;"></div>
                        <div class="preset-color" data-color="#f59e0b" style="background-color: #f59e0b;"></div>
                        <div class="preset-color" data-color="#ec4899" style="background-color: #ec4899;"></div>
                        <div class="preset-color" data-color="#ef4444" style="background-color: #ef4444;"></div>
                        <div class="preset-color" data-color="#6366f1" style="background-color: #6366f1;"></div>
                        <div class="preset-color" data-color="#06b6d4" style="background-color: #06b6d4;"></div>
                    </div>
                </div>
                
                <div class="color-picker-footer">
                    <button class="btn-cancel" type="button">取消</button>
                    <button class="btn-save" type="button">确定</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.pickerElement);
        this.bindEvents();
        this.updateColorDisplay();
    }

    bindEvents() {
        const slArea = this.pickerElement.querySelector('#saturation-lightness');
        const slCursor = this.pickerElement.querySelector('#sl-cursor');
        const hueSlider = this.pickerElement.querySelector('#hue-slider');
        const hueCursor = this.pickerElement.querySelector('#hue-cursor');
        const hexInput = this.pickerElement.querySelector('#hex-input');
        const closeBtn = this.pickerElement.querySelector('.color-picker-close');
        const cancelBtn = this.pickerElement.querySelector('.btn-cancel');
        const saveBtn = this.pickerElement.querySelector('.btn-save');
        const presetColors = this.pickerElement.querySelectorAll('.preset-color');

        // 饱和度和亮度选择
        let isDraggingSL = false;
        slArea.addEventListener('mousedown', (e) => {
            isDraggingSL = true;
            this.updateSaturationLightness(e, slArea);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingSL) {
                this.updateSaturationLightness(e, slArea);
            }
        });

        document.addEventListener('mouseup', () => {
            isDraggingSL = false;
        });

        // 色调滑块
        let isDraggingHue = false;
        hueSlider.addEventListener('mousedown', (e) => {
            isDraggingHue = true;
            this.updateHue(e, hueSlider);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingHue) {
                this.updateHue(e, hueSlider);
            }
        });

        document.addEventListener('mouseup', () => {
            isDraggingHue = false;
        });        // HEX输入
        hexInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            if (this.isValidHex(hex)) {
                this.setColor(hex);
            }
        });
        
        // 回车键确认
        hexInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.hide();
                if (this.onSave) this.onSave(this.currentColor);
            }
        });

        // 预设颜色
        presetColors.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.getAttribute('data-color');
                this.setColor(color);
            });
        });

        // 按钮事件
        closeBtn.addEventListener('click', () => this.hide());
        cancelBtn.addEventListener('click', () => {
            this.hide();
            if (this.onCancel) this.onCancel();
        });
        saveBtn.addEventListener('click', () => {
            this.hide();
            if (this.onSave) this.onSave(this.currentColor);
        });        // 点击外部关闭
        this.pickerElement.addEventListener('click', (e) => {
            if (e.target === this.pickerElement) {
                this.hide();
                if (this.onCancel) this.onCancel();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
                if (this.onCancel) this.onCancel();
            }
        });
    }

    updateSaturationLightness(e, area) {
        const rect = area.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        
        this.saturation = (x / rect.width) * 100;
        this.lightness = 100 - (y / rect.height) * 100;
        
        this.updateColorDisplay();
    }

    updateHue(e, slider) {
        const rect = slider.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        this.hue = (x / rect.width) * 360;
        this.updateColorDisplay();
    }

    updateColorDisplay() {
        // 更新当前颜色
        this.currentColor = this.hslToHex(this.hue, this.saturation, this.lightness);
        
        // 更新预览
        const preview = this.pickerElement.querySelector('#color-preview');
        preview.style.backgroundColor = this.currentColor;
        
        // 更新HEX输入
        const hexInput = this.pickerElement.querySelector('#hex-input');
        hexInput.value = this.currentColor;
        
        // 更新饱和度亮度区域背景
        const slArea = this.pickerElement.querySelector('#saturation-lightness');
        slArea.style.backgroundColor = `hsl(${this.hue}, 100%, 50%)`;
        
        // 更新游标位置
        const slCursor = this.pickerElement.querySelector('#sl-cursor');
        slCursor.style.left = `${this.saturation}%`;
        slCursor.style.top = `${100 - this.lightness}%`;
        
        const hueCursor = this.pickerElement.querySelector('#hue-cursor');
        hueCursor.style.left = `${(this.hue / 360) * 100}%`;
    }

    setColor(hex) {
        if (!this.isValidHex(hex)) return;
        
        this.currentColor = hex;
        const hsl = this.hexToHsl(hex);
        this.hue = hsl.h;
        this.saturation = hsl.s;
        this.lightness = hsl.l;
        
        this.updateColorDisplay();
    }    show(initialColor = '#6366f1', callbacks = {}) {
        console.log('CustomColorPicker: 显示颜色选择器', initialColor);
        this.setColor(initialColor);
        this.onSave = callbacks.onSave || null;
        this.onCancel = callbacks.onCancel || null;
        this.pickerElement.style.display = 'flex';
        this.isVisible = true;
    }

    hide() {
        this.pickerElement.style.display = 'none';
        this.isVisible = false;
    }

    // 工具函数
    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    hexToHsl(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return { h: 0, s: 0, l: 0 };

        let r = parseInt(result[1], 16) / 255;
        let g = parseInt(result[2], 16) / 255;
        let b = parseInt(result[3], 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }
}

// 全局实例
console.log('CustomColorPicker: 创建全局实例');
window.customColorPicker = new CustomColorPicker();
console.log('CustomColorPicker: 全局实例创建完成', window.customColorPicker);

// 测试函数
window.testColorPicker = function() {
    console.log('测试自定义颜色选择器');
    if (window.customColorPicker) {
        window.customColorPicker.show('#ff0000', {
            onSave: (color) => console.log('测试: 选择颜色', color),
            onCancel: () => console.log('测试: 取消选择')
        });
    } else {
        console.log('测试: 颜色选择器未找到');
    }
};
