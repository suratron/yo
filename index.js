import metro from '@revenge-mod/metro'
import { React, ReactNative } from '@revenge-mod/metro/common'
import { storage as rawStorage } from '@vendetta/plugin'
import StorageManager from 'shared:classes/StorageManager'
import { Stack, TableRowGroup, TableInputRow } from 'shared:components'

const storage = new StorageManager({
    storage: rawStorage,
    initialize() {
        return {
            enabled: true,
            customUsername: "YourNewUsername"
        }
    }
})

const unpatches = []

export default {
    onLoad: () => {
        const UserStore = metro.findByStoreName("UserStore")

        if (!UserStore) return console.error("[UsernameSpoof] UserStore not found")

        unpatches.push(
            metro.patcher.after("getCurrentUser", UserStore, (_, ret) => {
                if (!storage.get("enabled") || !ret) return ret

                const custom = (storage.get("customUsername") || "").trim()
                if (!custom) return ret

                // Create a proxy to spoof username
                return new Proxy(ret, {
                    get(target, prop) {
                        if (prop === "username") return custom
                        if (prop === "globalName") return custom
                        if (prop === "tag") {
                            const originalTag = Reflect.get(target, "tag")
                            return custom + (originalTag?.includes("#") ? originalTag.slice(originalTag.indexOf("#")) : "")
                        }
                        return Reflect.get(target, prop)
                    }
                })
            })
        )

        console.log("[UsernameSpoof] Loaded successfully")
    },

    onUnload: () => {
        unpatches.forEach(u => u?.())
        unpatches.length = 0
    },

    settings: () => {
        const [_, forceUpdate] = React.useReducer(x => ~x, 0)

        return React.createElement(
            ReactNative.ScrollView,
            { style: { flex: 1 } },
            React.createElement(
                Stack,
                { style: { padding: 16 } },
                React.createElement(TableRowGroup, { title: "Username Spoof" },
                    React.createElement(TableInputRow, {
                        label: "Custom Username",
                        placeholder: "Enter new username",
                        value: storage.get("customUsername") || "",
                        onChangeText: (text) => {
                            storage.set("customUsername", text)
                            forceUpdate()
                        }
                    }),
                    React.createElement(TableSwitchRow, {
                        label: "Enable Username Spoof",
                        value: storage.get("enabled"),
                        onValueChange: (v) => {
                            storage.set("enabled", v)
                            forceUpdate()
                        }
                    })
                )
            )
        )
    }
}
