
<p align="center">
 <a href="https://github.com/taurgis/homebridge-blueconnect-v2"><img alt="Homebridge iRobot" src="https://github.com/user-attachments/assets/7612a519-e5ad-487c-a815-c22158ee7550" width="600px"></a>
</p>

# homebridge-blueconnect-v2

Homebridge plugin for BlueRiiot devices. It reads the Swimming pool temperature, using the BlueConnect account to retrieve Temperature, sent to the Blueriiot cloud by the Device.

## Installation

npm install taurgis/homebridge-blueconnect-v2

## Configurations

The configuration parameters need to be added to `accessories` section of the Homebridge configuration file.

```json5
{
    ...
            "accessories": [
                {
                    "accessory": "BlueRiiot",
                    "name": "XXX",
                    "email": "XXX@XXX.XXX",
                    "password": "XXX"
                }
            ]
    ...
}
```


#### Parameters

* `accessory ` is required, with `BlueRiiot` value.  
* `name` (required) is anything you'd like to use to identify this device. You can always change the name from within the Home app.
* `email` and `password` (required) are the credentials you use in the BlueConnect app.
