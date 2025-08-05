# smart_contracts/voto3/contract.py
from algopy import (
    ARC4Contract,
    UInt64,
    Asset,
    Global,
    Txn,
    itxn,
    String,
    Bytes,
    Account,
    arc4,
)
from algopy.arc4 import abimethod
from typing import Tuple


class Voto3(ARC4Contract):

    estado_contrato: UInt64

    papeletas: Asset
    papeletas_enviadas: UInt64

    contador_compromisos: UInt64
    contador_anuladores: UInt64
    contador_raices: UInt64

    num_bloques: UInt64
    tam_bloque: UInt64
    tam_resto: UInt64

    # TODO cambiar a txId mejor si es cadena
    txnId_raiz: String

    def __init__(self) -> None:
        super().__init__()
        self.estado_contrato = UInt64(0)

        self.papeletas = Asset(0)
        self.papeletas_enviadas = UInt64(0)

        self.contador_compromisos = UInt64(0)
        self.contador_raices = UInt64(0)
        self.contador_anuladores = UInt64(0)

        self.num_bloques = UInt64(0)
        self.tam_bloque = UInt64(0)
        self.tam_resto = UInt64(0)

        self.txnId_raiz = String("")

    # ---------------

    @abimethod(allow_actions=["NoOp"])
    def inicializar_eleccion(
        self,
        asset_name: String,
        unit_name: String,
        total: UInt64,
    ) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede inicializar la elección"
        assert self.estado_contrato == UInt64(0), "El contrato ya está inicializado"

        name_bytes = asset_name.bytes
        unit_bytes = unit_name.bytes

        assert name_bytes.length <= 32, "asset_name demasiado largo"
        assert unit_bytes.length <= 8, "unit_name demasiado largo"

        asset_txn = itxn.AssetConfig(
            asset_name=name_bytes,
            unit_name=unit_bytes,
            total=total,
            decimals=0,
            manager=Global.current_application_address,
            clawback=Global.current_application_address,
        ).submit()

        self.papeletas = asset_txn.created_asset
        self.estado_contrato = UInt64(1)
        return self.papeletas.id

    # ---------------

    @abimethod(allow_actions=["NoOp"])
    def leer_estado_contrato(self) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede leer el estado del contrato"
        return self.estado_contrato

    @abimethod(allow_actions=["NoOp"])
    def establecer_estado_contrato(self, nuevo_estado: UInt64) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede establecer el estado del contrato"
        self.estado_contrato = nuevo_estado
        return self.estado_contrato

    # --------------

    @abimethod()
    def abrir_registro_compromisos(self) -> None:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede abrir el registro de compromisos"
        assert self.estado_contrato == UInt64(
            1
        ), "El contrato no está en el estado correcto"
        self.estado_contrato = UInt64(2)

    @abimethod()
    def registrar_compromiso(self) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede registrar compromisos"
        assert self.estado_contrato == UInt64(
            2
        ), "El contrato no está en el estado correcto"
        valor_actual = self.contador_compromisos
        self.contador_compromisos = valor_actual + 1
        return self.contador_compromisos

    @abimethod()
    def cerrar_registro_compromisos(self) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede cerrar el registro de compromisos"
        assert self.estado_contrato == UInt64(
            2
        ), "El contrato no está en el estado correcto"
        self.estado_contrato = UInt64(3)
        return self.contador_compromisos

    # --------------

    @abimethod()
    def abrir_registro_raices(
        self, num_bloques: UInt64, tam_bloque: UInt64, tam_resto: UInt64
    ) -> None:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede abrir el registro de raíces"
        assert self.estado_contrato == UInt64(
            3
        ), "El contrato no está en el estado correcto"
        self.num_bloques = num_bloques
        self.tam_bloque = tam_bloque
        self.tam_resto = tam_resto
        self.estado_contrato = UInt64(4)

    @abimethod()
    def registrar_raiz(self) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede registrar raíces"
        assert self.estado_contrato == UInt64(
            4
        ), "El contrato no está en el estado correcto"
        valor_actual = self.contador_raices
        self.contador_raices = valor_actual + 1
        return self.contador_raices

    @abimethod()
    def cerrar_registro_raices(self, txnId_raiz: String) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede cerrar el registro de raíces"
        assert self.estado_contrato == UInt64(
            4
        ), "El contrato no está en el estado correcto"
        self.estado_contrato = UInt64(5)
        self.txnId_raiz = txnId_raiz
        return self.contador_raices

    @abimethod()
    def leer_datos_raices(self) -> Tuple[UInt64, UInt64, UInt64, String]:
        assert self.estado_contrato >= UInt64(
            5
        ), "El contrato no está en el estado correcto"
        return (self.num_bloques, self.tam_bloque, self.tam_resto, self.txnId_raiz)

    # --------------

    # Métodos para anuladores
    @abimethod()
    def abrir_registro_anuladores(self) -> None:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede abrir el registro de anuladores"
        assert self.estado_contrato == UInt64(
            5
        ), "El contrato no está en el estado correcto"
        self.estado_contrato = UInt64(6)

    @abimethod()
    def registrar_anulador(self) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede registrar anuladores"
        assert self.estado_contrato == UInt64(
            6
        ), "El contrato no está en el estado correcto"
        valor_actual = self.contador_anuladores
        self.contador_anuladores = valor_actual + 1
        return self.contador_anuladores

    @abimethod()
    def enviar_papeleta(self, destinatario: Bytes) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede enviar papeletas"
        assert self.estado_contrato == UInt64(
            6
        ), "El contrato no está en el estado correcto"

        itxn.AssetTransfer(
            xfer_asset=self.papeletas.id,
            asset_amount=UInt64(1),
            asset_receiver=Account(destinatario),
            sender=Global.current_application_address,
            fee=UInt64(0),
        ).submit()

        valor_actual = self.papeletas_enviadas
        self.papeletas_enviadas = valor_actual + 1
        return self.papeletas_enviadas

    @abimethod()
    def cerrar_registro_anuladores(self) -> UInt64:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede cerrar el registro de anuladores"
        assert self.estado_contrato == UInt64(
            6
        ), "El contrato no está en el estado correcto"
        self.estado_contrato = UInt64(7)
        return self.contador_anuladores

    # --------------

    @abimethod(allow_actions=["NoOp"])
    def recuperar_papeletas(self, cuenta: Bytes) -> None:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede recuperar papeletas"
        assert self.estado_contrato == UInt64(7), "La elección no ha acabado"

        itxn.AssetTransfer(
            xfer_asset=self.papeletas.id,
            asset_amount=UInt64(1),
            asset_receiver=Global.current_application_address,
            sender=Account(cuenta),
            fee=UInt64(0),
        ).submit()

    @abimethod(allow_actions=["NoOp"])
    def finalizar_eleccion(self) -> None:
        assert (
            Txn.sender == Global.creator_address
        ), "Solo el creador puede finalizar la elección"
        assert self.estado_contrato == UInt64(7), "La elección no ha acabado"

        # Destruir el asset (papeletas)
        itxn.AssetConfig(
            config_asset=self.papeletas.id,
            manager=Global.zero_address,
            reserve=Global.zero_address,
            freeze=Global.zero_address,
            clawback=Global.zero_address,
            fee=UInt64(0),
        ).submit()

        # Devolver el crédito sobrante al creador del contrato
        saldo = Global.current_application_address.balance
        min_balance = Global.current_application_address.min_balance
        excedente = saldo - min_balance
        if excedente > UInt64(0):
            itxn.Payment(
                receiver=Global.creator_address,
                amount=excedente,
                fee=UInt64(0),
            ).submit()

        self.estado_contrato = UInt64(8)
