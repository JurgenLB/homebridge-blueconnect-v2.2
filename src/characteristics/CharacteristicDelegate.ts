import type { Characteristic, Logging, PlatformAccessory } from 'homebridge';
import type { PoolCustomCharacteristic } from './customHomeKitTypes.js';

/**
 * Delegate of a single HomeKit characteristic, inspired by the
 * `CharacteristicDelegate` pattern from homebridge-lib.
 *
 * Responsibilities:
 * - Lazily adds the characteristic to the service (or reuses the existing one).
 * - Restores the last-known value from `accessory.context` across restarts.
 * - Logs every value change via the Homebridge logger.
 * - Exposes a `value` setter that simultaneously persists the new value and
 *   pushes it to the HomeKit characteristic via `updateValue`, so HomeKit
 *   controllers are notified without a round-trip `onGet` call.
 * - Installs an `onGet` handler that returns the cached value (or throws
 *   `SERVICE_COMMUNICATION_FAILURE` when not authenticated).
 */
export class CharacteristicDelegate<T extends number | string | boolean> {
  private readonly _characteristic: Characteristic;
  private readonly _contextKey: string;
  private readonly _unit: string;

  constructor(
    private readonly _log: Logging,
    private readonly _accessory: PlatformAccessory,
    /** The service to attach the characteristic to. */
    service: { getCharacteristic(ctor: PoolCustomCharacteristic): Characteristic },
    /** The custom characteristic class (must have a static `UUID` property). */
    CharacteristicClass: PoolCustomCharacteristic,
    /** Key used to persist the value inside `accessory.context`. */
    contextKey: string,
    /** Initial/default value used when no persisted value exists yet. */
    defaultValue: T,
    /** Optional unit suffix for log messages (e.g. ' pH', ' mV'). */
    unit = '',
  ) {
    this._contextKey = contextKey;
    this._unit = unit;

    // Use the class-based overload: HAP returns the characteristic if it
    // already exists on the service, or adds it if absent. This avoids the
    // duplicate-UUID error that occurs when the service constructor already
    // pre-wired the characteristic via addCharacteristic().
    this._characteristic = service.getCharacteristic(CharacteristicClass);

    // Restore persisted value, or seed with the default.
    if (this._accessory.context[this._contextKey] == null) {
      this._accessory.context[this._contextKey] = defaultValue;
    }
    this._characteristic.updateValue(this._accessory.context[this._contextKey] as T);
  }

  /** Current cached value (persisted in accessory context). */
  get value(): T {
    return this._accessory.context[this._contextKey] as T;
  }

  /**
   * Update the value.
   * - Persists it in `accessory.context` (survives homebridge restarts).
   * - Pushes it to the HAP characteristic so connected HomeKit controllers
   *   receive an event notification immediately.
   * - Logs the change (old → new) at the info level.
   */
  set value(newValue: T) {
    const oldValue = this.value;
    if (newValue === oldValue) {
      return;
    }
    this._log.debug(
      `[${this._accessory.displayName}] ${this._characteristic.displayName}: ` +
      `${oldValue}${this._unit} → ${newValue}${this._unit}`,
    );
    this._accessory.context[this._contextKey] = newValue;
    this._characteristic.updateValue(newValue);
  }

  /**
   * Install an `onGet` handler.
   * The handler returns the cached value when `isAuthenticated()` is true,
   * and throws `SERVICE_COMMUNICATION_FAILURE` otherwise.
   *
   * @param isAuthenticated - Callback that returns whether the API session is active.
   * @param hapStatusError - Constructor for `HapStatusError` (from `api.hap`).
   * @param commFailureStatus - The numeric `HAPStatus.SERVICE_COMMUNICATION_FAILURE` value.
   */
  onGet(
    isAuthenticated: () => boolean,
    hapStatusError: new (status: number) => Error,
    commFailureStatus: number,
  ): this {
    this._characteristic.onGet(() => {
      if (isAuthenticated()) {
        return this.value;
      }
      throw new hapStatusError(commFailureStatus);
    });
    return this;
  }
}
